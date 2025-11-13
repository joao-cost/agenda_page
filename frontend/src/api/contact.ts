import { api } from "./client";

export interface ContactFormData {
  name: string;
  phone: string;
  vehicle: string;
  message?: string;
}

export const contactApi = {
  async submit(data: ContactFormData) {
    const response = await api.post("/contact", data);
    return response.data;
  }
};


