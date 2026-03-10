import Layout from './Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import Clients from './pages/Clients.jsx'
import ClientDetails from './pages/ClientDetails.jsx'
import Sales from './pages/Sales.jsx'
import NewSale from './pages/NewSale.jsx'
import SaleDetail from './pages/SaleDetail.jsx'
import Cash from './pages/Cash.jsx'
import CuentaCorriente from './pages/CuentaCorriente.jsx'
import EditSale from './pages/EditSale.jsx'

export const pagesConfig = {
  layout: Layout,
  mainPage: 'Dashboard',
  Pages: {
    Dashboard,
    Products,
    Clients,
    ClientDetails,
    Sales,
    NewSale,
    SaleDetail,
    Cash,
    CuentaCorriente,
    EditSale,
  },
}