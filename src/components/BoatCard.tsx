import Link from "next/link";

interface BoatCardProps {
  boat: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  };
}

export default function BoatCard({ boat }: BoatCardProps) {
  return (
    <Link href={`/boats/${boat.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {/* Mobile: Horizontal list view */}
        <div className="sm:hidden flex items-center p-3 gap-3">
          {boat.imageUrl ? (
            <img
              src={boat.imageUrl}
              alt={boat.name}
              className="w-16 h-16 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-1 truncate">{boat.name}</h3>
            {boat.description && (
              <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                {boat.description}
              </p>
            )}
          </div>
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>

        {/* Desktop/Tablet: Card view */}
        <div className="hidden sm:block">
          {boat.imageUrl ? (
            <img
              src={boat.imageUrl}
              alt={boat.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <svg
                className="w-20 h-20 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">{boat.name}</h3>
            {boat.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {boat.description}
              </p>
            )}
            <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium">
              View Calendar →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
