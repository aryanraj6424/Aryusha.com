export default function AddressCard({
  address,
  onDelete,
}) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow">

      <div className="flex justify-between items-start">

        <div>

          <h3 className="font-bold text-lg">
            {address.type}
          </h3>

          <p className="text-gray-600 mt-2">
            {address.fullAddress}
          </p>

          <p className="text-gray-500 mt-2">
            📞 {address.phone}
          </p>

        </div>

        <button
          onClick={() => onDelete(address.id)}
          className="bg-red-500 text-white px-4 py-2 rounded-xl"
        >
          Delete
        </button>

      </div>

    </div>
  );
}