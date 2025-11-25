import { useState } from "react";
import { Upload } from "lucide-react";




const CreateSend = ({ onSave , userId }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "text",
    content: "",
    expirationEnabled: false,
    deleteAfterDays: null,
    maxAccessEnabled: false,
    maxAccessCount: null,
    passwordProtectionEnabled: false,
    accessPassword: "",
    direction: "sent",
    userId: userId,

  });

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    onSave(formData);

    // Reset form
    setFormData({
      name: "",
      type: "text",
      content: "",
      expirationEnabled: false,
      deleteAfterDays: null,
      maxAccessEnabled: false,
      maxAccessCount: 5,
      passwordProtectionEnabled: false,
      accessPassword: "",
      direction: "sent",
       userId: userId,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, content: file });
    }
  };

  return (
    <div
      className="modal fade"
      id="createSendModal"
      tabIndex={-1}
      aria-labelledby="createSendModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold" id="createSendModalLabel">
                Create New Send
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "flex",
                }}
              >
                {/* Name and Type Row */}
                <div className="row mb-3" style={{ flex: 1 }}>
                  <div className="col-md-6">
                    <label
                      htmlFor="sendName"
                      className="form-label fw-semibold"
                    >
                      Name<span className="text-danger">*</span>
                    </label>
                    <input
                      id="sendName"
                      type="text"
                      className="form-control"
                      placeholder="What is this send for?"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      minLength={1}
                      style={{
                        backgroundColor: "#F3F3F5",
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label
                      htmlFor="sendType"
                      className="form-label fw-semibold"
                    >
                      Type
                    </label>
                    <select
                      id="sendType"
                      className="form-select"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value 
                        })
                      }
                      style={{
                        backgroundColor: "#F3F3F5",
                      }}
                    >
                      <option value="text">Text</option>
                      <option value="file">File</option>
                      <option value="credential">Credential</option>
                    </select>
                  </div>
                </div>

                {/* Content Field - Conditional based on type */}
              </div>
              <div className="mb-3" style={{ flex: 1 }}>
                <label htmlFor="sendContent" className="form-label fw-semibold">
                  Content<span className="text-danger">*</span>
                </label>

                {formData.type === "text" && (
                  <textarea
                    id="sendContent"
                    className="form-control"
                    rows={4}
                    placeholder="Enter the sensitive information to share..."
                    value={formData.content }
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    minLength={1}
                    style={{
                      backgroundColor: "#F3F3F5",
                      height: "4rem",
                    }}
                  ></textarea>
                )}
                {formData.type === "file" && (
                  <div>
                    <div className="input-group">
                      <input
                        type="file"
                        className="form-control"
                        id="fileUpload"
                        onChange={handleFileChange}
                        style={{
                          backgroundColor: "#F3F3F5",
                        }}
                      />
                      <label className="input-group-text" htmlFor="fileUpload">
                        <Upload size={18} className="me-1" />
                        Upload
                      </label>
                    </div>
                    {formData.content && (
                      <small className="text-muted d-block mt-1">
                        Selected:{" "}
                        {formData.content instanceof File
                          ? formData.content.name
                          : ""}
                      </small>
                    )}
                  </div>
                )}
                {formData.type === "credential" && (
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter vault ID"
                    value={formData.content }
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    style={{
                      backgroundColor: "#F3F3F5",
                    }}
                  />
                )}
              </div>

              {/* Expiration Date Toggle */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <label className="form-label fw-semibold mb-0">
                      Expiration Date
                    </label>
                    <small className="text-muted d-block">
                      Automatically deleted after specified time
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="expirationToggle"
                      checked={formData.expirationEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expirationEnabled: e.target.checked,
                          // Set default value when enabling, reset to null when disabling
                          deleteAfterDays: e.target.checked ? 7 : null,
                        })
                      }
                      style={{
                        backgroundColor: formData.expirationEnabled
                          ? "black"
                          : "white",

                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
                {formData.expirationEnabled && (
                  <div className="mt-2">
                    <label htmlFor="deleteAfterDays" className="form-label">
                      Delete after (days)
                    </label>
                    <select
                      id="deleteAfterDays"
                      className="form-select"
                      value={formData.deleteAfterDays ?? 7}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deleteAfterDays: Number(e.target.value),
                        })
                      }
                      style={{
                        backgroundColor: "#F3F3F5",
                      }}
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Maximum Access Count Toggle */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <label className="form-label fw-semibold mb-0">
                      Maximum Access Count
                    </label>
                    <small className="text-muted d-block">
                      Limit how many times this can be accessed
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="maxAccessToggle"
                      checked={formData.maxAccessEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxAccessEnabled: e.target.checked,
                        })
                      }
                      style={{
                        backgroundColor: formData.maxAccessEnabled
                          ? "black"
                          : "white",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
                {formData.maxAccessEnabled && (
                  <div className="mt-2">
                    <label htmlFor="maxAccessCount" className="form-label">
                      Maximum access count
                    </label>
                    <input
                      id="maxAccessCount"
                      type="number"
                      className="form-control"
                      placeholder="e.g., 5"
                      min="1"
                      value={formData.maxAccessCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxAccessCount: Number(e.target.value),
                        })
                      }
                      style={{
                        backgroundColor: "#F3F3F5",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Password Protection Toggle */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <label className="form-label fw-semibold mb-0">
                      Password Protection
                    </label>
                    <small className="text-muted d-block">
                      Require a password to access this send
                    </small>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      minLength={1}
                      className="form-check-input"
                      type="checkbox"
                      id="passwordToggle"
                      checked={formData.passwordProtectionEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passwordProtectionEnabled: e.target.checked,
                        })
                      }
                      style={{
                        backgroundColor: formData.passwordProtectionEnabled
                          ? "black"
                          : "white",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
                {formData.passwordProtectionEnabled && (
                  <div className="mt-2">
                    <label htmlFor="accessPassword" className="form-label">
                      Access Password<span className="text-danger">*</span>
                    </label>
                    <input
                      id="accessPassword"
                      type="password"
                      className="form-control"
                      placeholder="Enter access password"
                      value={formData.accessPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accessPassword: e.target.value,
                        })
                      }
                      required
                      style={{
                        backgroundColor: "#F3F3F5",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-dark"
                data-bs-dismiss="modal"
              >
                Create Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSend;
