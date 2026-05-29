import { createSupabaseServiceClient } from "@/lib/auth/server"

import {

  inferPetProfileCompleted,

  inferUserProfileSetupCompleted,

} from "@/lib/auth/onboarding"

import { findExistingColumn, findExistingColumns } from "@/lib/data/schema-compat"

import { fetchPrimaryPetRow } from "@/lib/pets/fetch-primary-pet"



type GenericRecord = Record<string, unknown>



/** 登录后若资料/宠物实际已齐全，补写完成标记，避免老用户反复走注册流程 */

export async function syncOnboardingCompletionFlags(userId: string) {

  const supabase = createSupabaseServiceClient()



  const userOwnerField = await findExistingColumn(supabase, "users", [

    "id",

    "user_id",

    "uid",

    "auth_user_id",

  ])



  const [userResult, primaryPetResult] = await Promise.all([

    userOwnerField

      ? supabase.from("users").select("*").eq(userOwnerField, userId).limit(1).maybeSingle()

      : Promise.resolve({ data: null, error: null }),

    fetchPrimaryPetRow(supabase, userId),

  ])



  if (userResult.error || primaryPetResult.error) return



  const userRow = (userResult.data ?? null) as GenericRecord | null

  const petRow = primaryPetResult.row

  const petOwnerField = primaryPetResult.ownerField



  if (userRow && userOwnerField && inferUserProfileSetupCompleted(userRow)) {

    const userWritable = await findExistingColumns(supabase, "users", [

      "profile_setup_completed",

      "user_profile_setup_completed",

      "updated_at",

    ])

    const flagField = ["profile_setup_completed", "user_profile_setup_completed"].find((field) =>

      userWritable.includes(field),

    )

    const alreadyDone = flagField ? userRow[flagField] === true : false

    if (flagField && !alreadyDone) {

      const payload: GenericRecord = { [flagField]: true }

      if (userWritable.includes("updated_at")) payload.updated_at = new Date().toISOString()

      await supabase.from("users").update(payload).eq(userOwnerField, userId)

    }

  }



  if (petRow && petOwnerField && inferPetProfileCompleted(petRow)) {

    const petWritable = await findExistingColumns(supabase, "pets", [

      "pet_setup_completed",

      "setup_completed",

      "updated_at",

    ])

    const flagField = ["pet_setup_completed", "setup_completed"].find((field) => petWritable.includes(field))

    const alreadyDone = flagField ? petRow[flagField] === true : false



    const idField = ["id", "pet_id"].find((field) => field in petRow)

    if (flagField && !alreadyDone && idField) {

      const payload: GenericRecord = { [flagField]: true }

      if (petWritable.includes("updated_at")) payload.updated_at = new Date().toISOString()

      await supabase.from("pets").update(payload).eq(idField, petRow[idField])

    }

  }

}


