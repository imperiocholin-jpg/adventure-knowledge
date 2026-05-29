"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { resolvePetGraveSrc } from "@/lib/pets/grave-registry"

interface PetDeathDialogProps {
  open: boolean
  petName?: string
  species?: string
}

export function PetDeathDialog({ open, petName = "小伙伴", species }: PetDeathDialogProps) {
  const router = useRouter()
  const graveSrc = resolvePetGraveSrc(species)

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm rounded-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg">宠物已离世</DialogTitle>
          <DialogDescription>
            {petName} 因饱食度耗尽离开了冒险队伍，你可以重新领养一只新的伙伴。
          </DialogDescription>
        </DialogHeader>

        <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-2xl bg-muted/40">
          <Image src={graveSrc} alt={`${petName}的纪念`} fill className="object-contain p-2" sizes="192px" />
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={() => router.push("/auth/pet-setup?readopt=1")}
          >
            重新领养宠物
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
