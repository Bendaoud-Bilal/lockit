import { create } from "zustand";



const useCurrent_SearchFolderQueryStore =
  create((set) => ({
    SearchFolderText: null,

    SetSearchFolder: (SearchFolderName) =>
      set(() => ({
        SearchFolderText: SearchFolderName,
      })),
  }));

export default useCurrent_SearchFolderQueryStore;
