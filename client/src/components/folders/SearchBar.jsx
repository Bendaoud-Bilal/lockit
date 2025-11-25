import useCurrent_SearchFolderQueryStore from "../../stores/SearchFolder";
import { Search } from "lucide-react";
import { useRef } from "react";

const searchBar = ({ onSearch }) => {
  const InputText = useRef(null);

  const handleOnChange = (e) => {
    useCurrent_SearchFolderQueryStore
      .getState()
      .SetSearchFolder(InputText.current?.value || "");

    if (
      InputText.current?.value === "" ||
      InputText.current?.value === null ||
      InputText.current?.value === undefined
    ) {
      onSearch();
    }
  };

  return (
    <div className="d-flex" role="search">
      <button
        className="btn btn-outline-secondary ms-2"
        onClick={() => onSearch()}
        style={{
          marginRight: "0.5rem",
        }}
        type="button"
      >
        <Search size={"1rem"} />
      </button>
      <input
        className="form-control me-2"
        type="search"
        placeholder="Search"
        aria-label="Search"
        ref={InputText}
        onChange={handleOnChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch();
          }
        }}
      />
    </div>
  );
};

export default searchBar;
