import { MatchDetail } from "../../../components/match-detail";

type MatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;

  return <MatchDetail matchId={id} />;
}
