import { TournamentDetail } from "../../../components/tournament-detail";

type TournamentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { id } = await params;

  return <TournamentDetail tournamentId={id} />;
}
