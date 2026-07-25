import LocationSelector from "../components/location/LocationSelector";

function LocationPage() {
  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] md:min-h-0 md:max-w-3xl md:mx-auto md:py-6 flex justify-center items-center">
      <LocationSelector />
    </div>
  );
}

export default LocationPage;