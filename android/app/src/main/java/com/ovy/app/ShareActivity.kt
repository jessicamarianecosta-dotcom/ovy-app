package com.ovy.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Recebe um áudio compartilhado (ex: WhatsApp → ⋮ → Compartilhar → Ovy) e
 * manda transcrever direto, sem precisar ouvir a mensagem.
 */
class ShareActivity : AppCompatActivity() {

    private lateinit var progressBar: ProgressBar
    private lateinit var statusText: TextView
    private lateinit var resultText: TextView
    private lateinit var copyButton: Button
    private lateinit var openButton: Button

    private var organizedText: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_share_result)

        progressBar = findViewById(R.id.progressBar)
        statusText = findViewById(R.id.statusText)
        resultText = findViewById(R.id.resultText)
        copyButton = findViewById(R.id.copyButton)
        openButton = findViewById(R.id.openButton)

        findViewById<Button>(R.id.closeButton).setOnClickListener { finish() }
        copyButton.setOnClickListener { copyToClipboard() }

        val apiKey = Prefs.getApiKey(this)
        if (apiKey.isNullOrBlank()) {
            showError("Nenhuma chave de API configurada. Abra o app Ovy, cole sua chave e tente compartilhar de novo.")
            return
        }

        val uri = extractAudioUri()
        if (uri == null) {
            showError("Não recebi nenhum áudio para transcrever.")
            return
        }

        transcribe(apiKey, uri)
    }

    private fun extractAudioUri(): Uri? {
        if (intent?.action != Intent.ACTION_SEND) return null
        @Suppress("DEPRECATION")
        return intent.getParcelableExtra(Intent.EXTRA_STREAM)
    }

    private fun transcribe(apiKey: String, uri: Uri) {
        CoroutineScope(Dispatchers.Main).launch {
            val outcome = withContext(Dispatchers.IO) {
                try {
                    val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        ?: return@withContext ApiClient.TranscribeResult.Error("Não consegui ler o arquivo de áudio.")
                    val filename = queryFileName(uri) ?: "audio.ogg"
                    val mimeType = resolveMimeType(uri, filename)
                    val durationSeconds = readDurationSeconds(uri)
                    ApiClient.transcribe(apiKey, bytes, filename, mimeType, durationSeconds)
                } catch (e: Exception) {
                    ApiClient.TranscribeResult.Error("Erro ao ler o áudio: ${e.message}")
                }
            }

            when (outcome) {
                is ApiClient.TranscribeResult.Success -> showResult(outcome.organizedText, outcome.id)
                is ApiClient.TranscribeResult.NeedsLogin -> showError(outcome.message)
                is ApiClient.TranscribeResult.OutOfMinutes -> showError(outcome.message)
                is ApiClient.TranscribeResult.Error -> showError(outcome.message)
            }
        }
    }

    /**
     * O WhatsApp costuma compartilhar o .opus das mensagens de voz com um
     * tipo genérico (application/octet-stream), que não ajuda o servidor a
     * reconhecer o formato — então damos prioridade à extensão real do
     * arquivo quando o tipo reportado não é um tipo de áudio específico.
     */
    private fun resolveMimeType(uri: Uri, filename: String): String {
        val reported = contentResolver.getType(uri) ?: intent.type
        if (reported != null && reported.startsWith("audio/")) return reported

        return when (filename.substringAfterLast('.', "").lowercase()) {
            "opus", "ogg" -> "audio/ogg"
            "m4a", "mp4", "aac" -> "audio/mp4"
            "mp3" -> "audio/mpeg"
            "wav" -> "audio/wav"
            "3gp", "3gpp" -> "audio/3gpp"
            "amr" -> "audio/amr"
            else -> reported ?: "audio/ogg"
        }
    }

    /**
     * O servidor tenta ler a duração do próprio arquivo, mas alguns .opus do
     * WhatsApp não são reconhecidos por essa biblioteca — manda essa duração
     * lida pelo próprio Android como reserva, senão a transcrição falha com
     * "não foi possível determinar a duração".
     */
    private fun readDurationSeconds(uri: Uri): Int? {
        val retriever = MediaMetadataRetriever()
        return try {
            retriever.setDataSource(this, uri)
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            durationMs?.toLongOrNull()?.let { ((it + 999) / 1000).toInt() }
        } catch (e: Exception) {
            null
        } finally {
            // release() existe desde a API 10; evitamos close() (só a partir
            // da API 29) pra não quebrar em aparelhos mais antigos.
            try {
                retriever.release()
            } catch (_: Exception) {
            }
        }
    }

    private fun queryFileName(uri: Uri): String? {
        return try {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (cursor.moveToFirst() && nameIndex >= 0) cursor.getString(nameIndex) else null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun showResult(text: String, id: String) {
        progressBar.visibility = View.GONE
        organizedText = text
        statusText.text = "Transcrição pronta:"
        resultText.text = text.ifBlank { "(áudio sem fala reconhecível)" }
        resultText.visibility = View.VISIBLE
        copyButton.visibility = View.VISIBLE
        if (id.isNotBlank()) {
            openButton.visibility = View.VISIBLE
            openButton.setOnClickListener {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://ovy-app.vercel.app/historico/$id")))
            }
        }
    }

    private fun showError(message: String) {
        progressBar.visibility = View.GONE
        statusText.text = message
    }

    private fun copyToClipboard() {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("Transcrição Ovy", organizedText))
        Toast.makeText(this, "Texto copiado.", Toast.LENGTH_SHORT).show()
    }
}
