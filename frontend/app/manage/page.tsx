export default function ManagePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-red-800">Product Management</h1>
      <p className="text-gray-400 mt-4">
        Client ID: [{process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID}]
      </p>
      <p className="text-gray-400">
        Tenant ID: [{process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID}]
      </p>
    </div>
  );
}