import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import link from "../services/link";






// Hook for fetching sends list
export const useSendList = (userId) => {
  const {
    data: sends = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sends", userId],
    queryFn: async () => {
      //@ts-ignore
      const sends = await link.Get("/api/send/" + userId + "/all");
      console.log("sends = " , sends);
      
      return sends ;
    },
  });

  return {
    sends,
    isLoading,
    error,
  };
};

// Hook for creating a send
export const useCreateSend = (userId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({

    mutationFn: async (sendData) => {
      console.log("data = " , sendData.content);
      sendData.direction = "sent";

      if (sendData.content instanceof File) {
            sendData.filename = sendData.content.name;
            const arrayBuffer = await sendData.content.arrayBuffer();
            const arrayData = Array.from(new Uint8Array(arrayBuffer));
            sendData.content = arrayData;
      }

     // sendData.content instanceof File ? sendData.content.name : undefined

      return await link.Post("/api/send" , sendData );
      
      //@ts-ignore
      // return await window.api.send.createSend(
      //   sendData.name,
      //   sendData.content,
      //   sendData.maxAccessCount,
      //   sendData.deleteAfterDays,
      //   sendData.type,
      //   sendData.accessPassword,
      //   sendData.direction,
      //   sendData.content instanceof File ? sendData.content.name : undefined
      // );
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["sends", userId] });
    },
    onError: (error) => {
      console.log("Failed to create send:", error);
    },
  });

  return {
    createSend: mutation.mutate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

// Hook for creating a send for Receiver
export const useCreateSendForReceiver = (userId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sendData) => {
      console.log("sending data to server = " , sendData);
      sendData.direction = "received";
      sendData.userId = userId;
      
      // Convert string to Date if needed, then calculate expiresAfter
      let expiresAt = sendData.expiresAt;
      if (expiresAt && typeof expiresAt === 'string') {
        expiresAt = new Date(expiresAt);
      }
      sendData.expiresAfter = expiresAt ? (expiresAt.getTime() - Date.now()) : null;
      
      const res = await link.Post("/api/send/createSendForReceiver" , sendData );

      const sends = res?.sends || res.data || res || [];

      return sends ;

      //@ts-ignore
      // return await window.api.send.createSendForReceiver(
      //   sendData.name,
      //   sendData.encryptedContent,
      //   sendData.contentIv,
      //   sendData.contentAuthTag,
      //   sendData.maxAccessCount,
      //   sendData.expiresAt!==undefined && sendData.expiresAt!==null? ( sendData.expiresAt.getTime() - Date.now()) /(1000*60*60*24): 0,
      //   sendData.type,
      //   sendData.passwordProtected,
      //   "received",
      //   sendData.filename
      // );
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["sends", userId] });
    },
    onError: (error) => {
      console.log("Failed to create send:", error);
    },
  });

  return {
    createSendForReceiver: mutation.mutate,
    isCreating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};
// Hook for deleting a send
export const useDeleteSend = (userId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sendId) => {

      return await link.Delete("/api/send/" + sendId);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["sends", userId] });
    },
    onError: (error) => {
      console.log("Failed to delete send:", error);
    },
  });

  return {
    deleteSend: mutation.mutate,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

export const useGetSendById = (sendId, password) => {

  console.log("useGetSendById called with sendId:", sendId, "password:", password ? password : "null");
  
  // Use a hash of password presence (not the password itself) to trigger refetch
  const passwordHash = password ? `pwd_${password.length}_${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}` : null;
  
  const {
    data: send = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["send", sendId, passwordHash],
    queryFn: async () => {
      console.log("Fetching send from API...");

      const send = await link.Get("/api/send/" + sendId, { password:password });
      console.log("Send fetched:", send?.id, "type:", send?.type, "contentLength:", Array.isArray(send?.content) ? send.content.length : typeof send?.content);
      return send;
    },
    enabled: !!sendId, // Only fetch if sendId is provided
    staleTime: 0, // Always refetch when password changes
    gcTime: 0, // Don't cache sensitive data
  });
  
  
  return {
    send,
    isLoading,
    error,
    refetch,
  };
};

export const useGetEncryptedSendById = (sendId) => {

 // console.log("useGetSendById called with sendId:", sendId, "password:", password ? "***" : "null");
  const {
    data: send = null,
    isLoading,
    error,
    
  } = useQuery({
    queryKey: ["send", sendId],
    queryFn: async () => {
      console.log("Fetching send from API...");
      //@ts-ignore
      const send = await link.Get("/api/send/encrypted/" + sendId );
      console.log("Send fetched:", send?.id, "type:", send?.type, "contentLength:", Array.isArray(send?.content) ? send.content.length : typeof send?.content);
      return send ;

    },
    enabled: !!sendId, // Only fetch if sendId is provided
    staleTime: Infinity, // Never mark as stale
    gcTime: Infinity, // Keep in cache forever (was cacheTime in older versions)
  });
  
  
  return {
    send,
    isLoading,
    error,
  };
};

export const useUpdateSendAccessCount = (sendId) => {
  const mutation = useMutation({
    mutationFn: async () => {
      return await link.Put("/api/send/" + sendId);
    },
    onSuccess: () => {
      console.log("Send access count updated");
    },
    onError: (error) => {
      console.log("Failed to update send access count:", error);
    },
  });

  return {
    updateAccessCount: mutation.mutate,
    isUpdating: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
};

