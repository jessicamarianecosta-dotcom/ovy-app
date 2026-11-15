package com.ovy.app

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Mesmo endpoint usado pela página principal do Ovy (/api/transcribe), que
 * agora também aceita autenticação por chave de API pessoal — a mesma usada
 * pela extensão Chrome.
 */
object ApiClient {
    private const val BASE_URL = "https://ovy-app.vercel.app"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(90, TimeUnit.SECONDS)
        .build()

    sealed class TranscribeResult {
        data class Success(val id: String, val organizedText: String, val faithfulText: String) : TranscribeResult()
        data class NeedsLogin(val message: String) : TranscribeResult()
        data class OutOfMinutes(val message: String) : TranscribeResult()
        data class Error(val message: String) : TranscribeResult()
    }

    fun transcribe(apiKey: String, bytes: ByteArray, filename: String, mimeType: String): TranscribeResult {
        return try {
            val mediaType = (mimeType.ifBlank { "audio/ogg" }).toMediaType()
            val body = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("audio", filename, bytes.toRequestBody(mediaType))
                .build()

            val request = Request.Builder()
                .url("$BASE_URL/api/transcribe")
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
                    response.code == 401 ->
                        TranscribeResult.NeedsLogin(json.optString("error", "Chave de API inválida ou não configurada."))
                    response.code == 402 ->
                        TranscribeResult.OutOfMinutes(json.optString("error", "Seus minutos acabaram neste ciclo."))
                    !response.isSuccessful ->
                        TranscribeResult.Error(json.optString("error", "Falha ao transcrever (HTTP ${response.code})."))
                    else -> TranscribeResult.Success(
                        json.optString("id", ""),
                        json.optString("organizedText", ""),
                        json.optString("faithfulText", "")
                    )
                }
            }
        } catch (e: Exception) {
            TranscribeResult.Error("Erro de rede: ${e.message}")
        }
    }
}
