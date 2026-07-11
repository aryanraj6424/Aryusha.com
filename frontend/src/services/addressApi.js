import API from "./authApi";

export const createAddress = async (
  addressData
) => {
  const response = await API.post(
    "/address/create",
    addressData
  );

  return response.data;
};


export const getUserAddresses =
  async (userId) => {

    const response =
      await API.get(
        `/address/user/${userId}`
      );

    return response.data;
};


export const deleteAddress =
  async (id) => {

    const response =
      await API.delete(
        `/address/${id}`
      );

    return response.data;
};