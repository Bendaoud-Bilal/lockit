import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIClient from "../services/api-client";
import { getAdapter } from "axios";







const CreateOffer = () => {
    const apiClient = new APIClient('/rtc');
    

  const mutation = useMutation({
    mutationFn: async (Request ) => {
      const res = await apiClient.post(Request , 'sendOffer');
      return res;
    },
    onSuccess: () => {
        console.log("offer been sent");
    },
    onError: (error) => {
      console.log("Failed to create offer:", error);
    },
  });
      
  return {
    createOffer: mutation.mutate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };

};


const CreateAnswer= () => {
    const apiClient = new APIClient('/rtc');
    

  const mutation= useMutation({
    mutationFn: async ( Request ) => {
      const res = await apiClient.post(Request , 'sendAnswer');
      return res;
    },
    onSuccess: () => {
        console.log("Answer been sent");
    },
    onError: (error) => {
      console.log("Failed to create Answer:", error);
    },
  });
    
  return {
    createAnswer: mutation.mutate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };

};


const GetOffer = () => {
  const apiClient = new APIClient('/rtc/getOffer');

   const queryClient = useQueryClient();
  
    const mutation = useMutation({
      mutationFn: async (senderName) => {
        if (senderName === "") {
          
          return null;
        } else {
        
        const response = await apiClient.get(senderName);

        return response.data;
        }
      },
      onSuccess: (data) => {
        // Update the folders cache with search results
        //queryClient.setQueryData(["Offers" , senderName] , data);
      },
    });
  
    return {
      getOffer: mutation.mutate,
      isSearching: mutation.isPending,
      searchResults: mutation.data,
      isError: mutation.isError,
      isSuccess:mutation.data!==null && mutation.data!==undefined&& !mutation.error ,
      OfferResult:mutation.data
    };


  
};



const GetAnswer = () => {
  const apiClient = new APIClient('/rtc/getAnswer');

   const queryClient = useQueryClient();
  
    const mutation = useMutation({
      mutationFn: async (receiverName) => {
        if (receiverName === "") {
          
          return null;
          
        } else {
        
        const response = await apiClient.get(receiverName);

        return response.data;
        }
      },
      onSuccess: (data) => {
        // Update the folders cache with search results
        //queryClient.setQueryData(["Offers" , receiverName] , data);
      },
    });
  
    return {
      getAnswer: mutation.mutate,
      isSearching: mutation.isPending,
      searchResults: mutation.data,
      isError: mutation.isError,
      isSuccess:mutation.data!==null && mutation.data!==undefined && !mutation.error ,
      AnswerResult:mutation.data
    };

};

 
 

export default { CreateOffer , CreateAnswer , GetOffer , GetAnswer };
