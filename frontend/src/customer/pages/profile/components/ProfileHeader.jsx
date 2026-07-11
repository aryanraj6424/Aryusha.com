function ProfileHeader({
  name,
  email,
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 mb-5">

      <h2 className="text-2xl font-bold">
        My Profile
      </h2>

      <p className="text-gray-600 mt-2">
        {name || "Customer"}
      </p>

      <p className="text-gray-400">
        {email || "No Email"}
      </p>

    </div>
  );
}

export default ProfileHeader;