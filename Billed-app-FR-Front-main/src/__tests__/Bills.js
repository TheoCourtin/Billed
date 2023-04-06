/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI, { rows } from "../views/BillsUI";
import { bills } from "../fixtures/bills";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router";
import Bills from "../containers/Bills";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  // ======================
  // Addition of unit tests
  // ======================

  describe("When I am on Bills page and I click on new bill button", () => {
    test("Then, a new bill form should be opened", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const bills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

      const clickNewBill = jest.fn((e) => bills.handleClickNewBill());

      const buttonNewBill = screen.getByTestId("btn-new-bill");

      buttonNewBill.addEventListener("click", clickNewBill);
      userEvent.click(buttonNewBill);
      expect(clickNewBill).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId("form-new-bill"));
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });

  describe('When I am on Bills and I click on the icon eye', async() => {
    test('Then a modal should open', () => {
      const onNavigate = (pathname) => {
       document.body.innerHTML = ROUTES({ pathname });
      };

      const store = null;
      const bill = new Bills({ document, onNavigate, store, localStorage: window.localStorage });
      const clickIconEye = jest.fn((icon) => bill.handleClickIconEye(icon));

      document.body.innerHTML = BillsUI({ data: bills });

      const iconEyesTest = screen.getAllByTestId('icon-eye');

      const modaleFile = document.getElementById("modaleFile");
      $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));

      iconEyesTest.forEach(icon => {
        icon.addEventListener('click', clickIconEye(icon));
        userEvent.click(icon);
        expect(clickIconEye).toHaveBeenCalled();

        expect(modaleFile.getAttribute("class")).toMatch("show");
      })
    });
  });
});

// test integration GET

describe("Given I am a user connected as Employee", () => {
  
  describe("When I navigate to Bills page", () => {
    
    test("Then fetches bills from mock API GET", async () => {
      
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
    
      await waitFor(() => screen.getByText("Mes notes de frais"));

      const type = await waitFor(() => screen.getByText("Type"));
      expect(type).toBeTruthy();

      const nom = screen.getByText("Nom");
      expect(nom).toBeTruthy();

      expect(screen.getByTestId("billDate")).toBeTruthy();

      const montant = screen.getByText("Montant");
      expect(montant).toBeTruthy();

      const statut = screen.getByText("Statut");
      expect(statut).toBeTruthy();

      const actions = screen.getByText("Actions");
      expect(actions).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("Then fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 404")),
        }));
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("Then fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500")),
        }));
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});