import {
  Clock,
  ShieldCheck,
  Mail,
} from "lucide-react";

export default function PendingApproval() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-xl w-full text-center">

        <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">

          <Clock
            size={45}
            className="text-yellow-600"
          />

        </div>

        <h1 className="text-3xl font-bold mt-6">
          Account Under Verification
        </h1>

        <p className="text-gray-600 mt-4 leading-relaxed">
          Thank you for registering as a vendor on
          QuickCart.
          <br />
          Our verification team is currently reviewing
          your business details and submitted documents.
        </p>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mt-8">

          <div className="flex items-center justify-center gap-2 text-purple-700 font-semibold">

            <ShieldCheck size={20} />

            Status: Pending Approval

          </div>

        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mt-4">

          <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold">

            <Mail size={20} />

            You will be notified once approved

          </div>

        </div>

        <div className="mt-8 text-gray-500">

          Estimated Approval Time

          <div className="text-xl font-bold text-gray-800 mt-2">
            24 - 48 Hours
          </div>

        </div>

        <button
          onClick={() =>
            window.location.reload()
          }
          className="mt-8 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
        >
          Check Status
        </button>

      </div>

    </div>
  );
}