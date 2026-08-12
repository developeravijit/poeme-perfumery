(function () {

  "use strict";


  // =====================================================
  // ELEMENTS
  // =====================================================

  const addressForm =
    document.getElementById("addressForm");

  const payBtn =
    document.getElementById("payBtn");

  const addressMessage =
    document.getElementById("addressMessage");


  // Cart may be empty.
  // In that case these elements do not exist.

  if (!addressForm || !payBtn) {
    return;
  }


  // =====================================================
  // ADDRESS FIELDS
  // =====================================================

  const fields = {

    name:
      document.getElementById("addressName"),

    phone:
      document.getElementById("addressPhone"),

    address:
      document.getElementById("addressLine"),

    city:
      document.getElementById("addressCity"),

    state:
      document.getElementById("addressState"),

    pincode:
      document.getElementById("addressPincode"),

  };


  // =====================================================
  // VALIDATE ADDRESS
  // =====================================================

  function validateAddress() {

    const name =
      fields.name.value.trim();

    const phone =
      fields.phone.value.trim();

    const address =
      fields.address.value.trim();

    const city =
      fields.city.value.trim();

    const state =
      fields.state.value.trim();

    const pincode =
      fields.pincode.value.trim();


    let valid = true;


    // ---------------------------------------------------
    // REMOVE OLD ERRORS
    // ---------------------------------------------------

    Object.values(fields).forEach(function (field) {

      if (field) {

        field.classList.remove(
          "input-error"
        );

      }

    });


    // ---------------------------------------------------
    // NAME
    // ---------------------------------------------------

    if (!name) {

      fields.name.classList.add(
        "input-error"
      );

      valid = false;

    }


    // ---------------------------------------------------
    // PHONE
    // ---------------------------------------------------

    if (
      !/^[6-9][0-9]{9}$/.test(phone)
    ) {

      fields.phone.classList.add(
        "input-error"
      );

      valid = false;

    }


    // ---------------------------------------------------
    // ADDRESS
    // ---------------------------------------------------

    if (!address) {

      fields.address.classList.add(
        "input-error"
      );

      valid = false;

    }


    // ---------------------------------------------------
    // CITY
    // ---------------------------------------------------

    if (!city) {

      fields.city.classList.add(
        "input-error"
      );

      valid = false;

    }


    // ---------------------------------------------------
    // STATE
    // ---------------------------------------------------

    if (!state) {

      fields.state.classList.add(
        "input-error"
      );

      valid = false;

    }


    // ---------------------------------------------------
    // PIN CODE
    // ---------------------------------------------------

    if (
      !/^[0-9]{6}$/.test(pincode)
    ) {

      fields.pincode.classList.add(
        "input-error"
      );

      valid = false;

    }


    // ---------------------------------------------------
    // BUTTON
    // ---------------------------------------------------

    payBtn.disabled = !valid;


    // ---------------------------------------------------
    // MESSAGE
    // ---------------------------------------------------

    if (valid) {

      addressMessage.textContent =
        "Delivery address verified. You can continue to payment.";

      addressMessage.classList.remove(
        "message-default",
        "message-error"
      );

      addressMessage.classList.add(
        "message-success"
      );

    } else {

      addressMessage.textContent =
        "Complete your delivery address to continue.";

      addressMessage.classList.remove(
        "message-success",
        "message-error"
      );

      addressMessage.classList.add(
        "message-default"
      );

    }


    return valid;

  }


  // =====================================================
  // LIVE VALIDATION
  // =====================================================

  Object.values(fields).forEach(function (field) {

    if (!field) {
      return;
    }


    field.addEventListener(
      "input",
      function () {

        validateAddress();

      }
    );

  });


  // Initial validation

  validateAddress();


  // =====================================================
  // SUBMIT
  // =====================================================

  addressForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();


      // -------------------------------------------------
      // VALIDATE
      // -------------------------------------------------

      if (!validateAddress()) {

        addressMessage.textContent =
          "Please complete all delivery details.";

        addressMessage.classList.remove(
          "message-success",
          "message-default"
        );

        addressMessage.classList.add(
          "message-error"
        );

        return;

      }


      // -------------------------------------------------
      // DISABLE BUTTON
      // -------------------------------------------------

      setPaymentLoading(true);


      // -------------------------------------------------
      // SHIPPING ADDRESS
      // -------------------------------------------------

      const shippingAddress = {

        name:
          fields.name.value.trim(),

        phone:
          fields.phone.value.trim(),

        address:
          fields.address.value.trim(),

        city:
          fields.city.value.trim(),

        state:
          fields.state.value.trim(),

        pincode:
          fields.pincode.value.trim(),

      };


      try {


        // =================================================
        // CREATE DATABASE + RAZORPAY ORDER
        // =================================================

        const response =
          await fetch(
            "/api/v1/payment/create-order",
            {

              method: "POST",

              credentials: "same-origin",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  shippingAddress:
                    shippingAddress,
                }),

            }
          );


        const data =
          await response.json();


        // =================================================
        // CREATE ORDER FAILED
        // =================================================

        if (
          !response.ok ||
          !data ||
          !data.success
        ) {

          alert(
            data.message ||
            "Unable to create payment order."
          );

          setPaymentLoading(false);

          return;

        }


        // =================================================
        // RAZORPAY OPTIONS
        // =================================================

        const options = {

          key:
            data.key,

          amount:
            data.amount,

          currency:
            data.currency,

          name:
            "POÈME Perfumery",

          description:
            "Order Payment",

          order_id:
            data.orderId,


          // =================================================
          // SUCCESS
          // =================================================

          handler:
            async function (razorResp) {

              await verifyPayment(
                razorResp,
                data.dbOrderId
              );

            },


          // =================================================
          // PREFILL
          // =================================================

          prefill: {

            name:
              shippingAddress.name,

            email:
              "<%= user ? user.email : "" %>",

            contact:
              shippingAddress.phone,

          },


          // =================================================
          // RAZORPAY NOTES
          // =================================================

          notes: {

            delivery_address:
              shippingAddress.address,

            city:
              shippingAddress.city,

            state:
              shippingAddress.state,

            pincode:
              shippingAddress.pincode,

          },


          // =================================================
          // THEME
          // =================================================

          theme: {

            color:
              "#B68D40",

          },

        };


        // =================================================
        // CREATE RAZORPAY INSTANCE
        // =================================================

        const razorpay =
          new Razorpay(options);


        // =================================================
        // PAYMENT FAILED
        // =================================================

        razorpay.on(
          "payment.failed",
          function (response) {

            console.error(
              "RAZORPAY PAYMENT FAILED:",
              response
            );


            alert(
              "Payment failed. Please try again."
            );


            setPaymentLoading(false);

          }
        );


        // =================================================
        // OPEN RAZORPAY
        // =================================================

        razorpay.open();


        // Restore button because
        // Razorpay modal is now handling payment.

        setPaymentLoading(false);

      } catch (error) {

        console.error(
          "PAYMENT INITIATION ERROR:",
          error
        );


        alert(
          "Payment initiation failed. Please try again."
        );


        setPaymentLoading(false);

      }

    }
  );


  // =====================================================
  // VERIFY PAYMENT
  // =====================================================

  async function verifyPayment(
    razorResp,
    dbOrderId
  ) {

    try {


      const response =
        await fetch(
          "/api/v1/payment/verify-payment",
          {

            method: "POST",

            credentials: "same-origin",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                razorpay_payment_id:
                  razorResp.razorpay_payment_id,

                razorpay_order_id:
                  razorResp.razorpay_order_id,

                razorpay_signature:
                  razorResp.razorpay_signature,

                dbOrderId:
                  dbOrderId,

              }),

          }
        );


      const data =
        await response.json();


      // =================================================
      // VERIFICATION SUCCESS
      // =================================================

      if (
        response.ok &&
        data &&
        data.success
      ) {

        addressMessage.textContent =
          "Payment successful. Redirecting to your orders...";


        addressMessage.classList.remove(
          "message-default",
          "message-error"
        );

        addressMessage.classList.add(
          "message-success"
        );


        window.location.href =
          "/poeme-perfumery/orders";


        return;

      }


      // =================================================
      // VERIFICATION FAILED
      // =================================================

      alert(
        data.message ||
        "Payment verification failed."
      );


      setPaymentLoading(false);

    } catch (error) {

      console.error(
        "PAYMENT VERIFICATION ERROR:",
        error
      );


      alert(
        "Payment verification error. Please contact support if money was deducted."
      );


      setPaymentLoading(false);

    }

  }


  // =====================================================
  // PAYMENT BUTTON STATE
  // =====================================================

  function setPaymentLoading(
    loading
  ) {

    if (loading) {

      payBtn.disabled = true;

      payBtn.classList.add(
        "payment-loading"
      );


      payBtn.innerHTML = `

        <span>
          Preparing Payment...
        </span>

        <i
          class="fa-solid fa-spinner fa-spin"
        ></i>

      `;

    } else {

      payBtn.classList.remove(
        "payment-loading"
      );


      payBtn.innerHTML = `

        <span>
          Proceed to Secure Payment
        </span>

        <i
          class="fa-solid fa-arrow-right"
        ></i>

      `;


      // Revalidate after restoring button

      validateAddress();

    }

  }


})();