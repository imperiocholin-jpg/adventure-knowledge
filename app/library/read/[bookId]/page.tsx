"use client"



import { useEffect, useMemo, useState } from "react"

import { useParams, useRouter } from "next/navigation"

import { ArrowLeft, BookOpen, Sparkles } from "lucide-react"



import { Button } from "@/components/ui/button"

import { PlayerPageShell, PlayerStickyHeader } from "@/components/layout/player-page-shell"

import { getReaderBookById } from "@/lib/library/book-catalog"

import { bookApiPath, normalizeBookId } from "@/lib/library/book-id-route"
import { getLocalBookById } from "@/lib/library/local-book-catalog"

import type { AdventureRegionId } from "@/lib/library/adventure-regions"



const LAST_READ_STORAGE_KEY = "ak_last_read_context"



interface ReaderBookPayload {

  id: string

  title: string

  author: string

  cover: string

  primaryRegionId: AdventureRegionId | null

  chapters: string[]

  chapterTitles: string[]

}



export default function ReaderPage() {

  const router = useRouter()

  const params = useParams<{ bookId: string }>()

  const rawBookId = params?.bookId

  const bookId = normalizeBookId(Array.isArray(rawBookId) ? rawBookId[0] ?? "" : rawBookId ?? "")



  const legacyBook = useMemo(() => (bookId ? getReaderBookById(bookId) : null), [bookId])

  const [book, setBook] = useState<ReaderBookPayload | null>(null)

  const [isLoading, setIsLoading] = useState(Boolean(bookId && !legacyBook))

  const [loadError, setLoadError] = useState<string | null>(null)

  const [chapterIndex, setChapterIndex] = useState(0)

  const [isCompleting, setIsCompleting] = useState(false)



  useEffect(() => {

    if (!bookId) return



    if (legacyBook) {

      setBook({

        id: legacyBook.id,

        title: legacyBook.title,

        author: legacyBook.author,

        cover: legacyBook.cover,

        primaryRegionId: legacyBook.primaryRegionId ?? null,

        chapters: legacyBook.chapters,

        chapterTitles: legacyBook.chapters.map((_, index) => `第${index + 1}章`),

      })

      setIsLoading(false)

      return

    }



    let cancelled = false

    async function loadBook() {

      setIsLoading(true)

      setLoadError(null)

      try {

        const response = await fetch(bookApiPath(bookId), { cache: "no-store" })

        const payload = await response.json()

        if (!response.ok || !payload?.ok) {

          throw new Error(payload?.error?.message ?? "无法加载书籍")

        }

        if (!cancelled) {

          setBook(payload.data as ReaderBookPayload)

        }

      } catch (error) {

        if (!cancelled) {

          setBook(null)

          setLoadError(error instanceof Error ? error.message : "无法加载书籍")

        }

      } finally {

        if (!cancelled) setIsLoading(false)

      }

    }



    void loadBook()

    return () => {

      cancelled = true

    }

  }, [bookId, legacyBook])



  if (isLoading) {

    return (

      <PlayerPageShell bottomPad="none" withGutter className="flex items-center justify-center bg-background p-6">

        <p className="text-sm text-muted-foreground">正在加载书籍…</p>

      </PlayerPageShell>

    )

  }



  if (!book) {

    const localMeta = bookId ? getLocalBookById(bookId) : null

    return (

      <PlayerPageShell

        bottomPad="none"

        withGutter

        className="flex flex-col items-center justify-center gap-3 bg-background p-6"

      >

        <p className="text-center text-sm text-muted-foreground">

          {localMeta

            ? `《${localMeta.title}》电子版尚未上线，请先在书架浏览其他已上线图书。`

            : loadError ?? "未找到该书籍。"}

        </p>

        <Button variant="outline" onClick={() => router.push("/library")}>

          返回书架

        </Button>

      </PlayerPageShell>

    )

  }



  const chapterText = book.chapters[chapterIndex] ?? book.chapters[0]

  const chapterLabel = book.chapterTitles[chapterIndex] ?? `第${chapterIndex + 1}章`

  const isLastChapter = chapterIndex >= book.chapters.length - 1



  const persistReadContext = () => {

    if (typeof window === "undefined") return

    window.localStorage.setItem(

      LAST_READ_STORAGE_KEY,

      JSON.stringify({

        bookId: book.id,

        sourceBookTitle: book.title,

        sourceChapterLabel: chapterLabel,

        updatedAt: Date.now(),

      }),

    )

  }



  const handleCompleteAndGoAdventure = async () => {

    setIsCompleting(true)

    try {

      persistReadContext()

      const regionId = book.primaryRegionId ?? "magic-forest"

      router.push(`/adventure/${regionId}?openAdventure=1`)

    } finally {

      setIsCompleting(false)

    }

  }



  return (

    <PlayerPageShell bottomPad="reader" className="bg-background">

      <PlayerStickyHeader className="border-border/40 bg-background/95 backdrop-blur">

        <div className="flex items-center justify-between px-4 py-3">

          <button

            type="button"

            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted"

            onClick={() => router.push("/library")}

          >

            <ArrowLeft className="h-5 w-5" />

          </button>

          <div className="text-center">

            <p className="text-[11px] text-muted-foreground">电子书阅读</p>

            <h1 className="text-sm font-semibold">{book.title}</h1>

          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">

            <BookOpen className="h-4 w-4 text-primary" />

          </div>

        </div>

      </PlayerStickyHeader>



      <div className="px-4 py-4">

        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-md">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-xs text-muted-foreground">{chapterLabel}</span>

            <span className="text-xs text-muted-foreground">

              {chapterIndex + 1}/{book.chapters.length}

            </span>

          </div>

          <h2 className="mb-1 text-lg font-bold text-card-foreground">

            {book.cover} {book.title}

          </h2>

          {book.author ? <p className="mb-4 text-xs text-muted-foreground">作者：{book.author}</p> : null}



          <div className="rounded-xl bg-muted/30 p-3">

            <p className="whitespace-pre-wrap text-sm leading-7 text-card-foreground">{chapterText}</p>

          </div>



          <div className="mt-4 flex gap-2">

            {!isLastChapter ? (

              <Button

                className="w-full"

                onClick={() => setChapterIndex((prev) => Math.min(prev + 1, book.chapters.length - 1))}

              >

                继续读下一章

              </Button>

            ) : (

              <Button

                className="w-full bg-gradient-to-r from-primary to-emerald-500"

                disabled={isCompleting}

                onClick={handleCompleteAndGoAdventure}

              >

                <Sparkles className="mr-2 h-4 w-4" />

                完成阅读，继续冒险

              </Button>

            )}

          </div>

        </div>

      </div>

    </PlayerPageShell>

  )

}


