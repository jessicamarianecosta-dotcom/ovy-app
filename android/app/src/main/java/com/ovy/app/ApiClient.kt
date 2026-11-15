package com.ovy.app

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Mesmo endpoint usado pela extensão Chrome (reaproveita o motor de
 * transcrição e a autenticação por chave de API já existentes no app web).
 */
object ApiClient {
    private const val BASE_URL = "https://ovy-app.vercel.app"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    sealed class ChunkResult {
        data class Success(val text: String) : ChunkResult()
        data class RateLimited(val retryAfterSeconds: Int, val message: String) : ChunkResult()
        data class Error(val message: String) : ChunkResult()
    }

    fun transcribeChunk(apiKey: String, file: File): ChunkResult {
        return try {
            val body = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart(
                    "audio",
                    file.name,
                    file.asRequestBody("audio/mp4".toMediaType())
                )
                .build()

            val request = Request.Builder()
                .url("$BASE_URL/api/extension/transcribe-chunk")
                .addHeader("Authorization", "Bearer $apiKey")
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()
                val json = try {
                    JSONObject(bodyString)
                } catch (e: Exception) {
                    JSONObject()
                }

                when {
                    response.code == 429 -> {
                        val retryAfter = json.optInt("retryAfter", 5)
                        ChunkResult.RateLimited(
                            retryAfter,
                            json.optString("error", "Limite de requisições atingido.")
                        )
                    }
                    !response.isSuccessful ->
                        ChunkResult.Error(json.optString("error", "Falha ao transcrever (HTTP ${response.code})."))
                    else -> ChunkResult.Success(json.optString("text", ""))
                }
            }
        } catch (e: Exception) {
            ChunkResult.Error("Erro de rede: ${e.message}")
        }
    }
}
