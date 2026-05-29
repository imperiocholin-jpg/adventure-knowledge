import { SocialRelationPage } from "@/components/social/social-relation-page"

export default function FollowingPage() {
  return (
    <SocialRelationPage
      title="我的关注"
      emptyText="还没有关注任何人，去排行榜找找冒险家吧"
      apiPath="/api/social/following"
    />
  )
}
