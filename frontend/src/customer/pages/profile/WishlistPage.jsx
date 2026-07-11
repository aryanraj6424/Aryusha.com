export default function WishlistPage() {

  const wishlist = [
    {
      id: 1,
      name: "Amul Milk",
      price: 32,
    },
    {
      id: 2,
      name: "Bread",
      price: 45,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-5">

      <h2 className="text-2xl font-bold mb-5">
        Wishlist
      </h2>

      <div className="space-y-4">

        {wishlist.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow p-5 flex justify-between"
          >
            <div>

              <h3 className="font-semibold">
                {item.name}
              </h3>

              <p>
                ₹{item.price}
              </p>

            </div>

            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg">
              Add To Cart
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}