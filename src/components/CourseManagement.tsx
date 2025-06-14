import { useCourseManagement } from "../hooks/useCourseManagement";
import { StandardCourseCatalog } from "./course/StandardCourseCatalog";
import { CourseForm } from "./course/CourseForm";
import { NotificationManager } from "./common/NotificationManager";
import { useUserSubscription } from "@/hooks/useUserSubscription"; // Import the subscription hook
import { Link } from "react-router-dom";

interface CourseManagementProps {
  studentId: string;
  onClose: () => void;
  onCourseAdded: () => void;
}

export function CourseManagement({
  studentId,
  onClose,
  onCourseAdded,
}: CourseManagementProps) {
  // Use the custom hook
  const courseManagement = useCourseManagement({
    studentId,
    onClose,
    onCourseAdded,
  });

  // Use the subscription hook
  const { isSubscribed, isTrialing, isLoading: isSubscriptionLoading } = useUserSubscription();

  const isAllowed = isSubscribed || isTrialing;

  if (isSubscriptionLoading) {
    // Optionally show a loading indicator while checking subscription
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAllowed) {
    // Show a message or redirect if not subscribed/trialing
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Required</h2>
          <p className="text-gray-700 mb-4">
            Adding courses requires an active subscription or trial. Please subscribe to continue.
          </p>
          <Link
            to="/subscribe"
            className="block text-blue-600 hover:underline mb-4 text-center"
          >
            View Subscription Plans
          </Link>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <NotificationManager
        notification={courseManagement.notification}
        onClose={() =>
          courseManagement.setNotification({
            ...courseManagement.notification,
            show: false,
          })
        }
      />

      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Course</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <StandardCourseCatalog
          categories={courseManagement.categories}
          selectedCategory={courseManagement.selectedCategory}
          onCategoryChange={(category) =>
            courseManagement.setSelectedCategory(category)
          }
          searchQuery={courseManagement.searchQuery}
          onSearchChange={(query) => courseManagement.setSearchQuery(query)}
          filteredCourses={courseManagement.filteredCourses}
          loadingCourses={courseManagement.loadingCourses}
          onCourseSelect={courseManagement.handleCourseSelect}
          selectedCourse={courseManagement.selectedCourse}
          getCategoryCount={courseManagement.getCategoryCount}
        />

        <CourseForm
          formData={courseManagement.formData}
          onFormChange={courseManagement.setFormData}
          onSubmit={courseManagement.handleSubmit}
          loading={courseManagement.loading}
          onCancel={onClose}
          generateAcademicYearOptions={
            courseManagement.generateAcademicYearOptions
          }
        />
      </div>
    </div>
  );
}
