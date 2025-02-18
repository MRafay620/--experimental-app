"use client";

import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation"; // Next.js navigation
import { getToken, onMessage } from "firebase/messaging";
import { initialize, isFirebaseSupported } from "../../../--experimental-app/src/app/firebase";
import ConfigurableValues from "../../../src/config/constants";
import { Box, CircularProgress } from "@mui/material";
import { useJsApiLoader } from "@react-google-maps/api";
import FlashMessage from "../../../src/components/FlashMessage";
import UserContext from "../../../src/context/User";
import * as Sentry from "@sentry/react";
import { useTranslation } from "react-i18next";

// Import your components/pages
import Home from "../../../src/screens/Home/Home";
import Restaurants from "../../../src/screens/Restaurants/Restaurants";
import RestaurantDetail from "../../../src/screens/RestaurantDetail/RestaurantDetail";
import Checkout from "../../../src/screens/Checkout/Checkout";
import Profile from "../../../src/screens/Profile/Profile";
import MyOrders from "../../../src/screens/MyOrders/MyOrders";
import OrderDetail from "../../../src/screens/OrderDetail/OrderDetail";
import Login from "../../../src/screens/Login/Login";
import Registration from "../../../src/screens/Registration/Registration";
import ForgotPassword from "../../../src/screens/ForgotPassword/ForgotPassword";
import VerifyEmail from "../../../src/screens/VerifyEmail/VerifyEmail";
import ResetPassword from "../../../src/screens/ResetPassword/ResetPassword";
import Stripe from "../../../src/screens/Stripe/Stripe";
import Paypal from "../../../src/screens/Paypal/Paypal";
import Settings from "../../../src/screens/Settings/Settings";
import PrivateRoute from "../../../src/routes/PrivateRoute";
import AuthRoute from "../../../src/routes/AuthRoute";

const GoogleMapsLoader = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const { GOOGLE_MAPS_KEY, LIBRARIES }: { GOOGLE_MAPS_KEY: string; LIBRARIES: Library[] } = ConfigurableValues();

  useEffect(() => {
    const initializeFirebase = async () => {
      if (await isFirebaseSupported()) {
        const messaging = initialize();
        Notification.requestPermission()
          .then(() => {
            getToken(messaging, {
              vapidKey: "BOpVOtmawD0hzOR0F5NQTz_7oTlNVwgKX_EgElDnFuILsaE_jWYPIExAMIIGS-nYmy1lhf2QWFHQnDEFWNG_Z5w",
            })
              .then((token) => {
                localStorage.setItem("messaging-token", token);
              })
              .catch(console.log);
          })
          .catch(console.log);

        onMessage(messaging, function (payload) {
          const { title, body } = payload.notification!;
          let localizedTitle = title;
          let localizedBody = body;
          let orderNo = "";

          if (title && title.startsWith("Order status:")) {
            localizedTitle = t(title);
            if (body) {
              const orderIdIndex = body.indexOf("Order ID");
              orderNo = body.slice(orderIdIndex + 9).trim();
              localizedBody = t("Order ID");
            }
          } else if (title === "Order placed" && body) {
            localizedTitle = t("orderPlaced");
            const orderIdIndex = body.indexOf("Order ID");
            orderNo = body.slice(orderIdIndex + 9).trim();
            localizedBody = t("Order ID");
          }

          setMessage(`${localizedTitle} ${localizedBody} ${orderNo}`);
        });
      }
    };

    initializeFirebase();
  }, [t, i18n]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  if (!isLoaded) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      {children}
      <FlashMessage severity="info" alertMessage={message} open={!!message} handleClose={() => setMessage(null)} />
    </>
  );
};

const App = () => {
  const userContext = useContext(UserContext);
  const isLoggedIn = userContext?.isLoggedIn ?? false;

  return (
    <GoogleMapsLoader>
      <main>
        <Home />
        <Restaurants />
        <RestaurantDetail />
        <Checkout />
        <Profile />
        <MyOrders />
        <OrderDetail />
        <Settings />

        {isLoggedIn ? <Checkout /> : <Login />}

        <AuthRoute>
          <Login />
          <Registration />
          <ForgotPassword />
          <VerifyEmail />
          <ResetPassword />
        </AuthRoute>

        <PrivateRoute>
          <Stripe />
          <Paypal />
        </PrivateRoute>
      </main>
    </GoogleMapsLoader>
  );
};

export default Sentry.withProfiler(App);
