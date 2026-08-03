
import './index.css'

import { Route, RouterProvider  ,createBrowserRouter , createRoutesFromElements,redirect, Navigate} from "react-router"
import Layout from './components/Layout.tsx'
import HomePage from './pages/HomePage.tsx'
import MapLayout from './pages/MapPage.tsx'
import MapCurrent from './pages/MapCurrent.tsx'
import Test from './pages/test.tsx'
import StartSession from './pages/StartSession.tsx'
import SignInPage , {action as signInAction} from './pages/SignInPage.tsx'
import LoginPage, {action as loginAction} from "./pages/LoginPage.tsx"
import AccountHolder , {loader as accountHolderLoader} from "./pages/AccountHolder.tsx"
import { loggIn } from "./lib/utils.ts"
import HistoralEvents from "./pages/HistoricalEvents.tsx"
import CurrentEventMap from "./pages/CurrentEventMap.tsx"
import AdminSidebarLayout from "./components/AdminSidebarLayout.tsx"
import AdminLocationsPage from "./pages/admin._pages/AdminLocationsPage.tsx"
// import AdminIncidentsPage from './pages/admin._pages/AdminIncidentsPage.tsx'
import AdminReportsPage from './pages/admin._pages/AdminReportsPage.tsx'
// import AdminSavedRoutesPage from './pages/admin._pages/AdminSavedRoutesPage.tsx'
import AdminUsersPage from './pages/admin._pages/AdminUsersPage.tsx'
import AdminStaffPage from './pages/admin._pages/AdminStaffPage.tsx'
import AdminSafetyReportPage from './pages/admin._pages/AdminSafetyReportPage.tsx'
import AiCandidatesPage from './pages/admin._pages/AiCandidatesPage.tsx'
import AdminTripReportPage from './pages/admin._pages/AdminTripReportPage.tsx'
import AdminHazardResponseReportPage from './pages/admin._pages/AdminHazardResponseReportPage.tsx'
import TrafficAuthorityDashboard from './pages/TrafficAuthorityDashboard.tsx'
import SecurityAgencyDashboard from './pages/SecurityAgencyDashboard.tsx'
import DataAnalystDashboard from './pages/DataAnalystDashboard.tsx'
import ContactPage from './pages/ContactPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

//sekelton for app

function AdminLoader(){

    const isAdmin = Boolean(localStorage.getItem("isAdmin"))
    if(!isAdmin){
        throw redirect("/login?message=access denied")
    }

    return null
}

// Generic role gate for the staff dashboards — Traffic Authority, Security
// Agency and Data Analyst. Mirrors AdminLoader's pattern but checks the
// stored userType against an allow-list instead of a single isAdmin flag.
function roleLoader(...allowedRoles: string[]) {
    return () => {
        const userType = localStorage.getItem("userType")
        if (!userType || !allowedRoles.includes(userType)) {
            throw redirect("/login?message=access denied")
        }
        return null
    }
}


function App() {
  
  const router = createBrowserRouter(
      createRoutesFromElements(
         <>
         <Route 
             path="/"
             element={<Layout/>}
          >
              <Route 
                 index 
                 element={<HomePage/>}
         
                />
              <Route 
                   path="about" 
                   element={<Test/>}
                />
              <Route
                  path="contact"
                  element={<ContactPage/>}
               />
              <Route
                 path="account"
                 loader={accountHolderLoader}
                 element={<AccountHolder/>}
               />
              <Route
                  path="*"
                  element={<NotFoundPage/>}
                />
          </Route>
          {/*
            The map is its own full-screen app shell, deliberately NOT nested
            under the marketing Layout — Layout's sticky header + footer were
            pushing the map's own h-screen toolbar below the fold.
          */}
          <Route
               path="map"
               element={<MapLayout/>}
               loader={()=>loggIn("login first to use map")}
          >
              <Route
                 index
                 element={<MapCurrent/>}
                 loader={()=>loggIn("login first to use map")}
                />
              <Route
                 path="historical_events"
                 element={<HistoralEvents/>}
                 loader={()=>loggIn("login first to use map")}
               />
              <Route
                 path="current_events"
                 element={<CurrentEventMap/>}
                 loader={()=>loggIn("login first to use map")}
              />
          </Route>
          <Route
            path="admin"
            loader={AdminLoader}
            element={<AdminSidebarLayout/>}
        >
            <Route index element={<Navigate to="/admin/driver-management" replace />} />
            <Route path="driver-management" element={<AdminUsersPage/>} />
            <Route path="destinations" element={<AdminLocationsPage/>} />
            <Route path="hazard-reports" element={<AdminReportsPage/>} />
            <Route path="staff-accounts" element={<AdminStaffPage/>} />
            <Route path="safety-report" element={<AdminSafetyReportPage/>} />
            <Route path="trip-completion-report" element={<AdminTripReportPage embedded/>} />
            <Route path="hazard-response-report" element={<AdminHazardResponseReportPage embedded/>} />
            <Route path="live-risk-intelligence" element={<AiCandidatesPage embedded/>} />
        </Route>
        {/* Standalone versions of the 3 shared report pages, unchanged — still
            used by Data Analyst / Traffic Authority / Security Agency
            dashboards, which don't get the admin sidebar. */}
        <Route
          path="ai-candidates"
          loader={roleLoader("admin", "data_analyst")}
          element={<AiCandidatesPage/>}
        />
        <Route
          path="trip-report"
          loader={roleLoader("admin", "data_analyst")}
          element={<AdminTripReportPage/>}
        />
        <Route
          path="hazard-response-report"
          loader={roleLoader("admin", "traffic_authority", "security_agency", "data_analyst")}
          element={<AdminHazardResponseReportPage/>}
        />
        <Route
          path="traffic-authority"
          loader={roleLoader("traffic_authority")}
          element={<TrafficAuthorityDashboard/>}
        />
        <Route
          path="security-agency"
          loader={roleLoader("security_agency")}
          element={<SecurityAgencyDashboard/>}
        />
        <Route
          path="data-analyst"
          loader={roleLoader("data_analyst", "admin")}
          element={<DataAnalystDashboard/>}
        />
          <Route
            path="/login" 
            element={<StartSession/>}
          >
                   <Route 
                      index 
                      action={loginAction}
                      element={<LoginPage/>}
                    />
                   <Route 
                      path="signin" 
                      action={signInAction}
                      element={<SignInPage/>}
                    />
         </Route>
         </>
      )
  )
  return  <RouterProvider router={router}/>

}

export default App 







