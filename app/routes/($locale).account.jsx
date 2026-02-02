import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details';

  return (
    <div className="account-page">
      <div className="account-page__inner">
        <header className="account-page__header">
          <h1 className="account-page__title">{heading}</h1>
        </header>
        <div className="account-grid">
          <AccountMenu />
          <div className="account-content">
            <Outlet context={{customer}} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  return (
    <nav className="account-nav" role="navigation">
      <NavLink 
        to="/account/orders" 
        className={({isActive}) => `account-nav__link ${isActive ? 'account-nav__link--active' : ''}`}
      >
        Orders
      </NavLink>
      <NavLink 
        to="/account/profile" 
        className={({isActive}) => `account-nav__link ${isActive ? 'account-nav__link--active' : ''}`}
      >
        Profile
      </NavLink>
      <NavLink 
        to="/account/addresses" 
        className={({isActive}) => `account-nav__link ${isActive ? 'account-nav__link--active' : ''}`}
      >
        Addresses
      </NavLink>
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button type="submit">Sign out</button>
    </Form>
  );
}

/** @typedef {import('./+types/account').Route} Route */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
