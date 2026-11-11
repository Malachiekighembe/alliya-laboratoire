import PublicProfileClient from "./PublicProfileClient";

export default function PublicUserProfilePage({ params }: { params: { id: string } }) {
  return <PublicProfileClient id={params.id} />;
}
