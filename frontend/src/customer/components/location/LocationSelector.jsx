import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Search, Home } from "lucide-react";
import { useToast } from "../../../components/Toast";
import { getUserAddresses } from "../../../services/addressApi";
import { getAddressFromCoords, searchLocation } from "../../../services/locationApi";

function LocationSelector() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const loadAddresses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      const response = await getUserAddresses(user._id);
      setAddresses(response.addresses || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Auto-detect location on first visit (if no address is stored)
  useEffect(() => {
    const stored = localStorage.getItem("selectedAddress");
    if (!stored) {
      handleCurrentLocation();
    }
  }, []);

  const handleSearchChange = async (value) => {
    setSearch(value);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await searchLocation(value);
      setSuggestions(results);
    } catch (error) {
      console.error("Location search failed:", error);
    }
  };

  const handleSelectSuggestion = (place) => {
    const selectedPlace = {
      addressType: "Search Location",
      fullAddress: place.properties.formatted,
      latitude: place.properties.lat,
      longitude: place.properties.lon,
      pincode: place.properties.postcode || "",
    };
    localStorage.setItem("selectedAddress", JSON.stringify(selectedPlace));
    navigate("/");
  };

  const handleUseAddress = (address) => {
    localStorage.setItem("selectedAddress", JSON.stringify(address));
    showToast({ type: "success", message: "Address Selected Successfully" });
    navigate("/");
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast({ type: "warning", message: "Geolocation not supported by your browser" });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await getAddressFromCoords(latitude, longitude);
          const currentAddress = {
            addressType: "Current Location",
            fullAddress: result.formatted,
            latitude,
            longitude,
            pincode: result.postcode,
          };
          localStorage.setItem("selectedAddress", JSON.stringify(currentAddress));
          setLoading(false);
          showToast({ type: "success", message: "Current Location Selected" });
          navigate("/");
        } catch (error) {
          console.error(error);
          setLoading(false);
          showToast({ type: "error", message: "Failed to fetch address" });
        }
      },
      (error) => {
        console.error(error);
        setLoading(false);
        showToast({ type: "error", message: "Location Permission Denied" });
      }
    );
  };

  const filteredAddresses = addresses.filter((address) =>
    `${address.houseNo} ${address.area} ${address.city} ${address.state}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
      <div className="p-5 border-b">
        <h2 className="text-xl font-bold">Select Your Location</h2>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search area, city, address..."
            className="w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:border-purple-500"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="mt-2 bg-white border rounded-xl overflow-hidden shadow-lg">
            {suggestions.map((place) => (
              <button
                key={place.properties.place_id}
                onClick={() => handleSelectSuggestion(place)}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b"
              >
                <div className="flex gap-3">
                  <MapPin size={18} className="mt-1 text-purple-600 flex-shrink-0" />
                  <span className="text-sm">{place.properties.formatted}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 flex gap-3">
        <button
          onClick={handleCurrentLocation}
          className="flex-1 border rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-purple-50"
        >
          <MapPin size={18} />
          {loading ? "Loading..." : "Use Current Location"}
        </button>

        <button
          onClick={() => navigate("/customer/addresses")}
          className="flex-1 border rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-purple-50"
        >
          <Plus size={18} />
          Add New Address
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold text-gray-400 mb-3">SAVED ADDRESSES</p>

        {filteredAddresses.length === 0 ? (
          <div className="bg-gray-50 border rounded-xl p-4 text-gray-500 text-sm">
            No Saved Addresses Found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAddresses.map((address) => (
              <div
                key={address._id}
                onClick={() => handleUseAddress(address)}
                className="bg-white border rounded-2xl p-4 cursor-pointer hover:border-purple-500 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Home size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{address.addressType}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.houseNo}, {address.area}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.city}, {address.state}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;