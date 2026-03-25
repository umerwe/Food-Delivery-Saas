
"use client"

import { useState } from "react"
import { API_BASE_URL } from "@/lib/constants"
import { toast } from "sonner"

export default function useApi(token: string | null) {

  const [loading, setLoading] = useState(false)

  const request = async (
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: any
  ) => {
    if (!token) return null

    try {
      setLoading(true)

      console.log("API Request:", {
        url: `${API_BASE_URL}${endpoint}`,
        method,
        body
      })

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(body && { body: JSON.stringify(body) }),
      })

      const data = await res.json()

      console.log("API Response:", {
        endpoint,
        method,
        status: res.status,
        response: data
      })

      if (!res.ok) {
        throw new Error(data?.message || "Request failed")
      }

      return data
       }   catch (err: any) {
  console.error("API Error:", err);
  return { error: err.message }; // return error instead
} finally {
      setLoading(false)
    }
  }

  return {
    loading,
    get: (endpoint: string) => request(endpoint, "GET"),
    post: (endpoint: string, body: any) => request(endpoint, "POST", body),
    patch: (endpoint: string, body: any) => request(endpoint, "PATCH", body),
    del: (endpoint: string) => request(endpoint, "DELETE"),
  }
}
