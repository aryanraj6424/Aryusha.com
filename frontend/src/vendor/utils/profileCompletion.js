/**
 * Reusable helper to calculate vendor profile completion percentage
 * and get the checklist items status.
 */
export function calculateVendorProfileCompletion(vendor, totalProducts = 0) {
  const checklist = [
    { key: "shopName", label: "Shop Name", value: vendor?.shopName, detail: vendor?.shopName },
    { key: "phone", label: "Contact Number", value: vendor?.phone, detail: vendor?.phone },
    { key: "businessEmail", label: "Business Email", value: vendor?.businessEmail, detail: vendor?.businessEmail },
    { key: "address", label: "Store Address Details", value: !!(vendor?.address?.city && vendor?.address?.state && vendor?.address?.pincode), detail: vendor?.address?.city ? `${vendor.address.city}, ${vendor.address.state || ""}` : "" },
    { key: "gstNumber", label: "GST / Business Reg Number", value: !!(vendor?.documents?.gstNumber || vendor?.documents?.businessRegNo), detail: vendor?.documents?.gstNumber || vendor?.documents?.businessRegNo },
    { key: "bankDetails", label: "Bank Account & Payout Details", value: !!(vendor?.documents?.bankDetails?.accountNumber && vendor?.documents?.bankDetails?.ifsc), detail: vendor?.documents?.bankDetails?.bankName ? `${vendor.documents.bankDetails.bankName} - ${vendor.documents.bankDetails.accountNumber}` : "" },
    { key: "ownerName", label: "Owner Info Name", value: vendor?.ownerDetails?.ownerName, detail: vendor?.ownerDetails?.ownerName },
    { key: "storeLogo", label: "Store Logo / Photo", value: !!(vendor?.storeDetails?.storeLogo || vendor?.documents?.storeFrontImage), detail: vendor?.storeDetails?.storeLogo || vendor?.documents?.storeFrontImage },
    { key: "location", label: "Assigned Service Area Location", value: !!(vendor?.latitude !== undefined && vendor?.longitude !== undefined && vendor?.latitude !== null && vendor?.longitude !== null), detail: vendor?.latitude ? `${vendor.latitude}, ${vendor.longitude}` : "" },
    { key: "products", label: "At least 1 product added to catalog", value: totalProducts > 0, detail: `${totalProducts} products listed` }
  ];

  const completed = checklist.filter(item => !!item.value).length;
  const total = checklist.length;
  const percentage = Math.round((completed / total) * 100);

  return {
    percentage,
    checklist,
    completed,
    total
  };
}
