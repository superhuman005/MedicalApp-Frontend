import API from "./api";
import type { Review } from "@/types";

export interface CreateReviewInput {
  doctorId: string;
  appointmentId?: string;
  rating: number; // 1-5
  comment?: string;
}

export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  const { data } = await API.post("/reviews", input);
  return data.review;
};

export const getDoctorReviews = async (doctorId: string): Promise<Review[]> => {
  const { data } = await API.get(`/reviews/doctor/${doctorId}`);
  return data.reviews;
};

// The logged-in patient's own submitted reviews - used to tell whether a
// given completed appointment already has a review, so the UI doesn't
// prompt again.
export const getMyReviews = async (): Promise<Review[]> => {
  const { data } = await API.get("/reviews/mine");
  return data.reviews;
};
