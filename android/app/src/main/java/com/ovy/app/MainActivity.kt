package com.ovy.app

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar

private const val HOME_URL = "https://ovy-app.vercel.app/app"
private const val SITE_HOST = "ovy-app.vercel.app"

/**
 * Tela principal do app: mostra o próprio site do Ovy (gravar, histórico,
 * plano, configurações — tudo) dentro de uma WebView, pra não ser "duas
 * coisas separadas" (o app e o site). A função de compartilhar áudio do
 * WhatsApp continua sendo tratada pela ShareActivity, à parte.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var loadingBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setSupportActionBar(findViewById<Toolbar>(R.id.toolbar))
        supportActionBar?.title = "Ovy"

        loadingBar = findViewById(R.id.loadingBar)
        webView = findViewById(R.id.webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                loadingBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                loadingBar.visibility = View.GONE
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: android.webkit.WebResourceRequest): Boolean {
                // Mantém a navegação dentro do app pro próprio site do Ovy;
                // qualquer outro domínio abre no navegador normal.
                val host = request.url.host
                return if (host != null && host != SITE_HOST) {
                    startActivity(Intent(Intent.ACTION_VIEW, request.url))
                    true
                } else {
                    false
                }
            }
        }

        if (savedInstanceState == null) {
            webView.loadUrl(HOME_URL)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.action_api_key) {
            startActivity(Intent(this, ApiKeySettingsActivity::class.java))
            return true
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
