import SEO from "../../../components/SEO";

export default function HelpSupportPage() {
  return (
    <div className="max-w-2xl mx-auto py-5 px-0 sm:px-5">
      <SEO
        title="Help & Support | Aryusha"
        description="Get assistance and customer support for your orders, deliveries, and account on Aryusha."
        canonicalUrl="https://aryusha.in/customer/support"
      />

      <h2 className="text-2xl font-bold mb-5">
        Help & Support
      </h2>

      <div className="bg-white rounded-2xl shadow p-5 space-y-5">
        <div>
          <h3 className="font-semibold">
            WhatsApp
          </h3>
          <p>
            8674811429
          </p>
        </div>

        <div>
          <h3 className="font-semibold">
            Email
          </h3>
          <p>
            support@aryusha.com
          </p>
        </div>

        <div>
          <h3 className="font-semibold">
            Phone
          </h3>
          <p>
            8674811429
          </p>
        </div>
      </div>
    </div>
  );
}