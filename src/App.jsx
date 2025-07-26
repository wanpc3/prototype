import Sidenav from './Components/Sidenav/Sidenav';
import PartnerDetails from './Components/Partner/PartnerDetails';
import PartnerDetails from './Components/Partner/AddPartner';
import './App.css';

  //Dummy Data
  const dummiesData = [
    {
      id: 'Starbucks',
      name: Starbucks,
      logo: '/icons/starbucks-logo.png',
      files: [
        { id: 'sb-file1', filename: 'Customers_Orders.xlsx', type: 'Tabular file', state: 'Anonymized', downloadLink: '#' },
        { id: 'sb-file2', filename: 'Marketing_Campaign.txt', type: 'Text file', state: 'De-anonymized', downloadLink: '#' },
      ],
      dataEncryptionKey: 'starbucksKey123',
      filePassword: 'sbPass',
      detectionSettings: {
        phoneNumber: true,
        icNumber: true,
        personCompanyName: true,
        email: true,
        addressGeographic: true,
        dateTime: false,
        ethnicityRaceNationality: true,
        creditCard: false,
      },
    },
    {
      id: 'bmw',
      name: 'BMW',
      logo: '/icons/bmw.svg',
      files: [
        { id: 'bmw-file1', filename: 'Finanial_Data.xlsx', type: 'Tabular file', state: 'Anonymized', downloadLink: '#' },
        { id: 'bmw-file2', filename: 'Client_Testimonial.txt', type: 'Text file', state: 'De-anonymized', downloadLink: '#' },
        { id: 'bmw-file3', filename: 'Purchase_record.csv', type: 'Tabular file', state: 'Anonymized', downloadLink: '#' },
        { id: 'bmw-file4', filename: 'IC_photo.jpg', type: 'Image file', state: 'Anonymized', downloadLink: '#' },
      ],
      dataEncryptionKey: 'bmwKey456',
      filePassword: 'bmwPass',
      detectionSettings: {
        phoneNumber: true,
        icNumber: true,
        personCompanyName: true,
        email: true,
        addressGeographic: true,
        dateTime: true,
        ethnicityRaceNationality: true,
        creditCard: true,
      },
    },
    {
    id: 'salesforce',
    name: 'Salesforce',
    logo: '/icons/salesforce.svg',
    files: [
        { id: 'sf-file1', filename: 'CRM_Data_Q1.xlsx', type: 'Tabular file', state: 'Anonymized', downloadLink: '#' },
    ],
    dataEncryptionKey: 'sfKey789',
    filePassword: 'sfPass',
      detectionSettings: {
        phoneNumber: true,
        icNumber: true,
        personCompanyName: true,
        email: true,
        addressGeographic: true,
        dateTime: true,
        ethnicityRaceNationality: true,
        creditCard: true,
      },
    },
  ];

function App() {

  return (
    <div className="app-container">
      {/* Sidenav */}
      <Sidenav />

      {/* Main Content Area */}
      <div className="main-content">
        <PartnerDetails />
      </div>

      {/* Add Partner Modal */}
      <AddPartner />
    </div>
  );
}

export default App;
