import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div>
      <PageHeader title="Page not found" description="The page you requested does not exist." />
      <Card>
        <p className="text-sm text-zinc-400">Check the URL or return to the dashboard.</p>
        <div className="mt-4 flex gap-2">
          <Link to="/">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link to="/shipments">
            <Button variant="secondary">View Shipments</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
