import apiService from "./apiService";

const Get = async(url , query) => {
  try {
    const response = await apiService.axiosInstance.get(url , { params: query } );
    return response; // interceptor already extracts .data
  }
    catch (error) {
    throw error;
  }
};

const Post = async(url, data) => {
  try {
    const response = await apiService.axiosInstance.post(url, data);
    return response; // interceptor already extracts .data
  } catch (error) {
    throw error;
  }
};

const Delete = async(url , data ) => {
    try {
    const response = await apiService.axiosInstance.delete(url
      , { data: data }
    );
    return response; // interceptor already extracts .data
  } catch (error) {
    throw error;
  }
};

const Put = async(url, data) => {
    try {
    const response = await apiService.axiosInstance.put(url , data);
    return response; // interceptor already extracts .data
    } catch (error) {   
    throw error;
  }
};

export default {
  Get,
  Post,
  Delete,
  Put,
};
