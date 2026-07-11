function CartSummary({ items }) {

  const total = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow p-5">

      <h2 className="font-bold text-lg mb-4">
        Order Summary
      </h2>

      <div className="flex justify-between mb-2">
        <span>Total</span>

        <span>₹{total}</span>
      </div>

      <button className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl">
        Proceed To Checkout
      </button>

    </div>
  );
}

export default CartSummary;