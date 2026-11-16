plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.ovy.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ovy.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    // Uma keystore de debug fixa (versionada no repo) garante que todo build
    // — seja daqui, do GitHub Actions ou de qualquer máquina — saia assinado
    // sempre com a mesma identidade. Sem isso, cada build do zero (ex: um
    // runner novo do GitHub Actions) gera uma keystore de debug diferente, e
    // o Android trata isso como "outro app": reinstalar pode falhar ou criar
    // um segundo ícone em vez de atualizar o mesmo app.
    signingConfigs {
        getByName("debug") {
            storeFile = file("../debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = false
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
