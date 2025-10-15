import { DeviceIssueDetail } from '@/components/device-material-issue/DeviceIssueDetail';

type DeviceIssueDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeviceIssueDetailPage({ params }: DeviceIssueDetailPageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <DeviceIssueDetail id={id} />
    </div>
  );
}
