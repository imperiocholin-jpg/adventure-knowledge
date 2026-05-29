import { SocialRelationPage } from "@/components/social/social-relation-page"

export default function FollowersPage() {
  return (
    <SocialRelationPage
      title="我的粉丝"
      emptyText="还没有粉丝，多参与对战和阅读会有更多伙伴关注你"
      apiPath="/api/social/followers"
    />
  )
}
