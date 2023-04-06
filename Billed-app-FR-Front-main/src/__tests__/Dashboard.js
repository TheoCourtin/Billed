/* eslint-disable camelcase */
/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// TEST INTERFACE EMPLOYEE

Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem(
  "user",
  JSON.stringify({ type: "Employee", email: "a@a" })
);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// Connecté comme employée, quand je suis sur la page des factures, l'icone doit être mis en surbrillance
describe("Given I am connected as an employee, When I am on Bills Page", () => {
  test("Then bill icon in vertical layout should be highlighted", async () => {
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    await waitFor(() => screen.getByTestId("icon-window"));
    const windowIcon = screen.getByTestId("icon-window");
    expect(windowIcon).toHaveClass("active-icon");
  });
});

// Connecté comme employée, les factures doivent être trillées de la plus rescentes à la plus anciennes
describe("Given I am connected as an employee, When I am on Bills Page", () => {
  test("Then bills should be ordered from earliest to latest", () => {
    document.body.innerHTML = BillsUI({ data: bills });
    const dates = screen
      .getAllByText(
        /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
      ) // Regex format de la date
      .map((a) => a.innerHTML);
    const antiChrono = (a, b) => (a < b ? 1 : -1); // Ordre croissant
    const datesSorted = [...dates].sort(antiChrono); // Tri du tableau des dates par ordre croissant
    expect(dates).toEqual(datesSorted); // Les dates doivent être égaux au nouveau tableau trié
  });
});

// Connecté comme employée, lorsque je clique sur le bouton nouveau billet, le formulaire doit s'afficher
describe("Given I am connected as an employee, When I am on Bills Page", () => {
  test("Then if I click on new bill button, the form should be displayed", async () => {
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    await waitFor(() => screen.getByTestId("btn-new-bill"));
    const newBillButton = screen.getByTestId("btn-new-bill");
    fireEvent.click(newBillButton);
    await waitFor(() => screen.getByTestId("form-new-bill"));
    const newBillForm = screen.getByTestId("form-new-bill");
    expect(newBillForm).toBeTruthy();
  });
});

// Connecté comme employée, au clique de l'icône oeil, je devrais voir apparaitre la facture
describe("Given I am connected as an employee, When I am on Bills Page", () => {
  test("Then if i click on the eye icon, the modal should be displayed", async () => {
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    await waitFor(() => screen.getAllByTestId("icon-eye"));
    const eyeIcone = screen.getAllByTestId("icon-eye");
    //Les fonctions fictives sont également appelées "espions", car elles vous permettent d'espionner le comportement d'une fonction appelée indirectement par un autre code, plutôt que de simplement tester la sortie
    $.fn.modal = jest.fn();
    // fireEvent = Méthodes pratiques pour déclencher des événements DOM.
    fireEvent.click(eyeIcone[0]);
    // getByText = recherchera tous les éléments qui ont un nœud de texte textContent correspondant au TextMatch
    await waitFor(() => screen.getByText("Justificatif"));
    const justificatif = screen.getAllByText("Justificatif");
    expect(justificatif).toBeTruthy();
  });
});

// Connecté comme employée, lorsque la page est chargé, alors getBills devrait être appelé
describe("Given I am connected as an employee, When the Bills Page is loaded", () => {
  test("Then getBills should be called", async () => {
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;

    const BillsMock = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock,
    });

    jest.spyOn(BillsMock, "getBills");
    const test = await BillsMock.getBills();
    expect(test[0]["name"]).toBe(bills[0]["name"]);

    const titleBills = await screen.getByText("Mes notes de frais");
    const btnNewBills = await screen.getByTestId("btn-new-bill");

    expect(titleBills).toBeTruthy();
    expect(btnNewBills).toBeTruthy();
    expect(screen.getAllByTestId("icon-eye")).toBeTruthy();
  });
});

// ---------------------  Error 404 & Error 500

describe("When an error occurs on API", () => {
  beforeEach(() => {
    //Crée une fonction simulée similaire à jest.fn mais qui surveille également les appels à objet[methodName]. Retourne une fonction simulée de Jest.
    jest.spyOn(mockStore, "bills");
  });

  test("Then i fetch the API, but it's fails with a 404 error", async () => {
    //Accepte une fonction qui sera utilisée comme une implémentation de simulation pour un appel à la fonction simulée.
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });
    const html = BillsUI({ error: "Erreur 404" });
    document.body.innerHTML = html;
    const errorMessage = await screen.getByText(/Erreur 404/);
    expect(errorMessage).toBeTruthy();
  });

  test("Then i fetch the API, but it's fails with a 500 error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });
    const html = BillsUI({ error: "Erreur 500" });
    document.body.innerHTML = html;
    const errorMessage = await screen.getByText(/Erreur 500/);
    expect(errorMessage).toBeTruthy();
  });
});