import useCurrent_SearchFolderQueryStore from "../../stores/SearchFolder";
import { Search } from "lucide-react";
import { useRef, useEffect } from "react";

const SearchBar = ({ onSearch }) => {
  const InputText = useRef(null);

  // Debounce function to delay search
  useEffect(() => {
    let timeoutId;

    const handleDebounceSearch = () => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout - search after 500ms of no typing
      timeoutId = setTimeout(() => {
        onSearch();
      }, 500);
    };

    // Get current input element
    const inputElement = InputText.current;
    
    if (inputElement) {
      inputElement.addEventListener('input', handleDebounceSearch);
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        inputElement.removeEventListener('input', handleDebounceSearch);
      };
    }
  }, [onSearch]);

  const handleOnChange = (e) => {
    useCurrent_SearchFolderQueryStore
      .getState()
      .SetSearchFolder(InputText.current?.value || "");
  };

  return (
    <>
      <div className="flex-shrink-0">
        <Search className="w-5" strokeWidth={1} />
      </div>
      <div className="flex-1 min-w-0">
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-md bg-gray-100 px-3 py-2 focus:outline-none text-sm sm:text-base"
          ref={InputText}
          onChange={handleOnChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
        />
      </div>
    </>
  );
};

export default SearchBar;