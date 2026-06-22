
import './index.css'

import { Route, RouterProvider  ,createBrowserRouter , createRoutesFromElements,redirect} from "react-router"
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
import AdminPage from "./pages/admin._pages/Admin.tsx"
import AdminLocationsPage from "./pages/admin._pages/AdminLocationsPage.tsx"
import AdminAlertLogPage from './pages/admin._pages/AdminAlertLogPage.tsx'
import AdminIncidentsPage from './pages/admin._pages/AdminIncidentsPage.tsx'
import AdminReportsPage from './pages/admin._pages/AdminReportsPage.tsx'
import AdminSavedRoutesPage from './pages/admin._pages/AdminSavedRoutesPage.tsx'
import AdminUsersPage from './pages/admin._pages/AdminUsersPage.tsx'
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
                  <Route 
                     path="safe_route" 
                     element={<h1>Current location</h1>}
                     loader={()=>loggIn("login first to use map")}
                   />
              </Route>
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
          <Route
            path="admin"
            loader={AdminLoader}
            element={<AdminPage/>}
        />
        <Route
          path ="admin_locations"
          loader={AdminLoader}
          element={<AdminLocationsPage/>}
        />
        <Route
          path ="alert_log.html"
          loader={AdminLoader}
          element={<AdminAlertLogPage/>}
        />
        <Route
          path ="incidents.html"
          loader={AdminLoader}
          element={<AdminIncidentsPage/>}
        />
         <Route
          path ="reports.html"
          loader={AdminLoader}
          element={<AdminReportsPage/>}
        />
        <Route
          path ="saved_routes.html"
          loader={AdminLoader}
          element={<AdminSavedRoutesPage/>}
        />
        <Route
          path ="users.html"
          loader={AdminLoader}
          element={<AdminUsersPage/>}
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







