/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import BillsUI from "../views/BillsUI";
import NewBillUI from '../views/NewBillUI';
import { bills } from '../fixtures/bills';
import NewBill from '../containers/NewBill';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store';
import router from '../app/Router';

jest.mock('../app/Store', () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then submit form for newBill", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }));

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBillTest = new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      });

      const NewBillForm = screen.getByTestId("form-new-bill");
      expect(NewBillForm).toBeTruthy();

      const handleSubmit = jest.fn((e) => newBillTest.handleSubmit(e));
      NewBillForm.addEventListener("submit", handleSubmit);
      fireEvent.submit(NewBillForm);
      expect(handleSubmit).toHaveBeenCalled();
    })
  })


  test("Then verify there is a bill's picture", async() => {
    jest.spyOn(mockStore, "bills");

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }      

    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['NewBill']} });
    window.localStorage.setItem("user", JSON.stringify({
      type: "Employee"
    }));

    const html = NewBillUI();
    document.body.innerHTML = html;

    const newBillInit = new NewBill({
      document, onNavigate, store: mockStore, localStorage: window.localStorage
    });

    const file = new File(['image'], 'image.png', {type: 'image/png'});
    const handleChangeFile = jest.fn((e) => newBillInit.handleChangeFile(e));
    const formNewBill = screen.getByTestId("form-new-bill");
    const billFile = screen.getByTestId('file');

    billFile.addEventListener("change", handleChangeFile);     
    userEvent.upload(billFile, file);
    
    expect(billFile.files[0].name).toBeDefined();
    expect(handleChangeFile).toBeCalled();
   
    const handleSubmit = jest.fn((e) => newBillInit.handleSubmit(e));
    formNewBill.addEventListener("submit", handleSubmit);
    fireEvent.submit(formNewBill);
    expect(handleSubmit).toHaveBeenCalled();
  });
});

// test integration POST

describe('Given I am a user connected as Employee and I am on NewBill page', () => {
  describe('When I submit the new bill', () => {
    test('Then create a new bill from mock API POST', async () => {

      const bill = [{
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      }]
  
      const callStore = jest.spyOn(mockStore, 'bills');
      mockStore.bills().create(bill);
      expect(callStore).toHaveBeenCalled();
    });

    // Tests errors 404 and 500
    describe('When an error occurs on API', () => {
      test('Then create new bill from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          create: () => Promise.reject(new Error('Erreur 404')),
        }));
        document.body.innerHTML = BillsUI({ error: 'Erreur 404'})

        // await for response
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test('Then create new bill from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          create: (bill) => Promise.reject(new Error('Erreur 500')),
        }));

        // Construct DOM
        document.body.innerHTML = BillsUI({ error: 'Erreur 500'})
        // await for response
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});