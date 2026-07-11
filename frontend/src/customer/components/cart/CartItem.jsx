function CartItem({
  item,
  onIncrease,
  onDecrease,
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow flex justify-between">

      <div>
        <h3 className="font-semibold">
          {item.name}
        </h3>

        <p>₹{item.price}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            onDecrease(item.id)
          }
          className="px-3 py-1 bg-gray-200 rounded"
        >
          -
        </button>

        <span>{item.quantity}</span>

        <button
          onClick={() =>
            onIncrease(item.id)
          }
          className="px-3 py-1 bg-purple-600 text-white rounded"
        >
          +
        </button>
      </div>

    </div>
  );
}

export default CartItem;