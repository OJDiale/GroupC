import toast from "react-hot-toast";

// Set your backend base url
const BASE_URL = "https://mapper-backend-brkn.onrender.com";

/**
 * Helper to extract the authentication token for protected routes
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
};

/**
 * Registers a new user with the SQLite backend
 */
export async function addUser(email, password, username, firstName, lastName, userType = "normal") {
    try {
        // Fixed the string interpolation bug: `${BASE_URL}/api/auth/register`
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, username, firstName, lastName, userType })
        });

        const data = await response.json(); 

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong during registration.");
        }

     
        return {
            userType : data.userType,
            token: data.token
        };
    } catch (error) {
        console.error("Registration error:", error.message);
        throw error;
    }
}

export const  checkForAdmin = async (userType) => {

     return userType === "admin"

};

/**
 * Maps a resolved userType (from login/register) to the dashboard route
 * that role should land on.
 */
export const dashboardPathForRole = (userType) => {
    switch (userType) {
        case "admin": return "/admin";
        case "traffic_authority": return "/traffic-authority";
        case "security_agency": return "/security-agency";
        case "data_analyst": return "/data-analyst";
        default: return "/map";
    }
};

/**
 * Admin-only: creates a staff account (System Administrator, Traffic
 * Authority, Security Agency or Data Analyst). Requires the caller's own
 * admin token.
 */
export async function registerStaffAccount(email, password, username, firstName, lastName, role) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/register-staff`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ email, password, username, firstName, lastName, role })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to create staff account.");
        }

        return data;
    } catch (error) {
        console.error("Staff registration error:", error.message);
        throw error;
    }
}
/**
 * Authenticates an existing user
 */
export const loginWithEmailAndPassword = async (identifier, password) => {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Invalid credentials.");
        }
        return data;
    } catch (error) {
        console.error("Login error:", error.message);
        throw error;
    }
};



/**
 * Fetches fresh profile database records for the securely logged-in session user.
 */
export const userData = async () => {
    const token = localStorage.getItem("token");
  

    // Block immediately if the user is unauthenticated
    if (!token ) {
        throw new Error("No authenticated user session found.");
    }

    try {
        const response = await fetch(`${BASE_URL}/api/users`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Validates via backend authenticateToken middleware
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to retrieve fresh user profile.");
        }
      console.log(data.user)
        // Returns the database entity payload (email, username, firstname, lastname)
        return data.user; 
    } catch (error) {
        console.error("Error in userData synchronization workflow:", error.message);
        throw error;
    }
};

/**
 * Removes user profile record entirely from the system
 */
export const deleteUserAccount = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No user currently logged in.");

    try {
        // Notice the clean, parameterless endpoint URL string
        const response = await fetch(`${BASE_URL}/api/users`, {
            method: "DELETE",
            headers: getAuthHeaders() // Contains Authorization: Bearer <token>
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to delete account.");

        // Clear session and state cleanly
        localStorage.clear();
        toast.success("Account deleted successfully.");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user account context:", error.message);
        toast.error("Could not delete account.");
        throw error;
    }
};

/**
 * Updates explicit profile record attributes using the context of the JWT token
 */
export const updateUserInfo = async (updatedFields) => {
    const token = localStorage.getItem("token");
    if (!token) {
        toast.error("You must be logged in to update your profile.");
        throw new Error("No authenticated user.");
    }

    try {
        // Parameterless endpoint matching the strict context pattern
        const response = await fetch(`${BASE_URL}/api/users`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedFields)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to update profile.");

        toast.success("Profile updated successfully!");
        return { success: true };
    } catch (error) {
        console.error("Error updating user info payload:", error.message);
        toast.error("Failed to update profile.");
        throw error;
    }
};
