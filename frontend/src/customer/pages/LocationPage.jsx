import LocationSelector from "../components/location/LocationSelector";

function LocationPage() {
  return (
    <div className="w-full min-h-[calc(100vh-120px)] md:min-h-0 md:max-w-3xl md:mx-auto md:py-4 flex justify-center items-center overflow-visible">
      <LocationSelector />
    </div>
  );
}

export default LocationPage;