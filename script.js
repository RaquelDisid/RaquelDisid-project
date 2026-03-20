'use strict';

const SaborRaiz = (() => {

    //  MANEJO DE ERRORES

    // Error de validación de formulario
    class ErrorValidacion extends Error {
        constructor(mensaje) {
            super(mensaje);
            this.name = 'ErrorValidacion';
        }
    }

    // Error de red o respuesta no OK del servidor.
    class ErrorRed extends Error {
        constructor(mensaje, status = null) {
            super(mensaje);
            this.name = 'ErrorRed';
            this.status = status;
        }
    }

    // Error de almacenamiento
    class ErrorAlmacenamiento extends Error {
        constructor(mensaje) {
            super(mensaje);
            this.name = 'ErrorAlmacenamiento';
        }
    }



    //  DETECCIÓN DE CARACTERÍSTICAS

    const Soporte = {

        sessionStorage: (() => {
            try {
                const prueba = '__test__';
                sessionStorage.setItem(prueba, prueba);
                sessionStorage.removeItem(prueba);
                return true;
            } catch {
                return false;
            }
        })(),

        fetch: typeof fetch === 'function',
    };



    //  ALMACENAMIENTO (sessionStorage)

    const Storage = {

        guardar(clave, valor) {
            if (!Soporte.sessionStorage) return;
            try {
                sessionStorage.setItem(clave, valor);
            } catch (e) {
                console.warn(new ErrorAlmacenamiento(`No se pudo guardar "${clave}": ${e.message}`));
            }
        },

        leer(clave) {
            if (!Soporte.sessionStorage) return null;
            try {
                return sessionStorage.getItem(clave);
            } catch (e) {
                console.warn(new ErrorAlmacenamiento(`No se pudo leer "${clave}": ${e.message}`));
                return null;
            }
        },

        eliminar(clave) {
            if (!Soporte.sessionStorage) return;
            try {
                sessionStorage.removeItem(clave);
            } catch (e) {
                console.warn(new ErrorAlmacenamiento(`No se pudo eliminar "${clave}": ${e.message}`));
            }
        },

        limpiar() {
            if (!Soporte.sessionStorage) return;
            try {
                sessionStorage.clear();
            } catch (e) {
                console.warn(new ErrorAlmacenamiento(`No se pudo limpiar el storage: ${e.message}`));
            }
        },
    };


    // VALIDACIÓN

    const Validacion = {

        reglas: {
            nombre(el) {
                if (!el.value.trim())
                    return 'El nombre es obligatorio.';
                if (el.value.trim().length < 2)
                    return 'El nombre debe tener al menos 2 caracteres.';
                return '';
            },
            email(el) {
                if (!el.value.trim())
                    return 'El correo electrónico es obligatorio.';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()))
                    return 'Introduce un correo electrónico válido (ejemplo: ana@correo.com).';
                return '';
            },
            telefono(el) {
                if (!el.value.trim())
                    return 'El teléfono es obligatorio.';
                if (!/^[0-9]{9}$/.test(el.value.trim()))
                    return 'El teléfono debe tener exactamente 9 dígitos numéricos.';
                return '';
            },
            provincia(el) {
                if (!el.value) return 'Selecciona una provincia o región.';
                return '';
            },
            fecha(el) {
                if (!el.value) return 'La fecha es obligatoria.';
                const hoy = new Date(new Date().toDateString());
                if (new Date(el.value) < hoy) return 'La fecha no puede ser anterior a hoy.';
                return '';
            },
            hora(el) {
                if (!el.value)                            return 'La hora es obligatoria.';
                if (el.value < '13:00' || el.value > '23:30')
                    return 'El horario de atención es de 13:00 a 23:30.';
                return '';
            },
            comensales_normal(el) {
                const val = parseInt(el.value, 10);
                if (!el.value)          return 'Indica el número de personas.';
                if (isNaN(val) || val < 1 || val > 9)
                    return 'El número de personas debe estar entre 1 y 9.';
                return '';
            },
            comensales_evento(el) {
                const val = parseInt(el.value, 10);
                if (!el.value) return 'Indica el número de personas para el evento.';
                if (isNaN(val) || val < 10)
                    return 'Los eventos grupales requieren un mínimo de 10 personas.';
                return '';
            },
            curriculum(el) {
                if (!el.files || el.files.length === 0) return 'Adjunta tu CV para continuar.';
                const ext = el.files[0].name.split('.').pop().toLowerCase();
                if (!['pdf', 'doc', 'docx'].includes(ext))
                    return 'El archivo debe ser PDF o DOC.';
                const MAX_MB = 5;
                if (el.files[0].size > MAX_MB * 1024 * 1024)
                    return `El archivo no debe superar los ${MAX_MB} MB.`;
                return '';
            },
            terminos(el) {
                if (!el.checked) return 'Debes aceptar los términos y condiciones para continuar.';
                return '';
            },
        },

        esCampoActivo(campo) {
            if (campo.type === 'checkbox' || campo.type === 'radio') {
                const contenedor = campo.closest('.checkbox-group, .radio-group, fieldset, div');
                return contenedor ? contenedor.offsetParent !== null : true;
            }
            return campo.offsetParent !== null;
        },


        validarCampo(campo) {
            const regla = this.reglas[campo.id];
            if (!regla) return true;
            if (!this.esCampoActivo(campo)) {
                UI.limpiarError(campo);
                return true;
            }

            const mensajeError = regla(campo);
            UI.mostrarError(campo, mensajeError);
            return mensajeError === '';
        },


        validarTodo(campos) {
            let esValido = true;
            campos.forEach(campo => {
                if (!this.validarCampo(campo)) esValido = false;
            });
            return esValido;
        },
    };


    // FUNCIONES QUE TOCAN EL DOM

    const UI = {

        mostrarError(campo, mensaje) {
            const span = document.getElementById(`error-${campo.id}`);
            if (!span) return;

            if (mensaje) {
                span.textContent = mensaje;
                span.classList.add('visible');
                campo.classList.add('invalido');
                campo.setAttribute('aria-invalid', 'true');
            } else {
                this.limpiarError(campo);
            }
        },


        limpiarError(campo) {
            const span = document.getElementById(`error-${campo.id}`);
            if (span) {
                span.textContent = '';
                span.classList.remove('visible');
            }
            campo.classList.remove('invalido');
            campo.setAttribute('aria-invalid', 'false');
        },

        mostrarMensajeEnvio(contenedor, tipo, texto) {
            contenedor.textContent = texto;
            contenedor.className = `mensaje-envio ${tipo}`;
            contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        },

        limpiarMensajeEnvio(contenedor) {
            contenedor.textContent = '';
            contenedor.className = '';
        },

        setVisible(el, visible) {
            el.classList.toggle('oculto', !visible);
            el.setAttribute('aria-hidden', String(!visible));
        },

        setEstadoBoton(btn, enviando) {
            btn.disabled = enviando;
            btn.textContent = enviando ? 'Enviando reserva…' : 'Confirmar Reserva';
        },
    };



    //  INTERFAZ

    const Interfaz = {

        elementos: {},

        actualizar() {
            const { radioEvento, radioEmpleo,
                fieldsetReserva, contenedorComensalesNormal,
                comensalesNormal, seccionGrupos,
                comensalesEvento, contenedorArchivo } = this.elementos;

            const esEvento = radioEvento?.checked ?? false;
            const esEmpleo = radioEmpleo?.checked ?? false;

            //  Fieldset de reserva: oculto en "Trabajar con nosotros"
            UI.setVisible(fieldsetReserva, !esEmpleo);
            // Campos data-required: solo obligatorios cuando su sección es visible
            fieldsetReserva.querySelectorAll('[data-required]').forEach(c => {
                c.required = !esEmpleo;
            });

            // Número de personas estándar: oculto en "Evento privado"
            UI.setVisible(contenedorComensalesNormal, !esEvento);
            comensalesNormal.required = !esEvento && !esEmpleo;

            //  Sección de grupos: visible solo en "Evento privado"
            UI.setVisible(seccionGrupos, esEvento);
            comensalesEvento.required = esEvento;

            //  Sección CV: visible solo en "Trabajar con nosotros"
            UI.setVisible(contenedorArchivo, esEmpleo);

            // Limpiar errores de campos recién ocultados
            if (esEmpleo) {
                ['fecha', 'hora', 'comensales_normal', 'comensales_evento'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) UI.limpiarError(el);
                });
            }
            if (!esEvento) UI.limpiarError(comensalesEvento);
            if (!esEmpleo) {
                const cv = document.getElementById('curriculum');
                if (cv) UI.limpiarError(cv);
            }
        },
    };



    // Guardar y restaurar datos del formulario con sessionStorage.

    const Persistencia = {

        guardarCampo(e) {
            const { id, value, type, checked, name } = e.target;

            if (type === 'radio') {
                if (checked) Storage.guardar(name, id);
            } else if (type === 'checkbox') {
                checked
                    ? Storage.guardar(name, id)
                    : Storage.eliminar(name);
            } else if (type !== 'file') {
                // Los inputs de archivo no se guardan (restricción de seguridad del navegador)
                Storage.guardar(id, value);
            }
        },

        cargarTodo(inputs) {
            inputs.forEach(input => {
                const { id, type, name } = input;

                try {
                    if (type === 'radio') {
                        const guardado = Storage.leer(name);
                        if (guardado === id) input.checked = true;
                    } else if (type === 'checkbox') {
                        const guardado = Storage.leer(name);
                        if (guardado === id) input.checked = true;
                    } else if (type !== 'file') {
                        const guardado = Storage.leer(id);
                        if (guardado !== null) input.value = guardado;
                    }
                } catch (e) {

                    console.warn(`No se pudo restaurar el campo "${id}":`, e.message);
                }
            });
        },
    };



    // ENVÍO

    const Envio = {

        async simularFetch(datos) {

            const SIMULAR = 'exito';  //Cambiar a error

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (SIMULAR === 'exito') {
                        resolve({ ok: true, mensaje: 'Reserva confirmada.' });
                    } else {
                        reject(new ErrorRed('El servidor no respondió correctamente.', 503));
                    }
                }, 1800);
            });

        },


        async manejar(e, refs) {
            e.preventDefault();

            const { formulario, inputs, btn, mensajeEnvio } = refs;

            // Limpiar feedback anterior
            UI.limpiarMensajeEnvio(mensajeEnvio);

            // — Validación completa antes de enviar
            const esValido = Validacion.validarTodo(inputs);

            if (!esValido) {
                // Enfocar el primer campo con error para guiar al usuario por teclado
                const primerCampoInvalido = formulario.querySelector('[aria-invalid="true"]');
                if (primerCampoInvalido) {
                    primerCampoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    primerCampoInvalido.focus({ preventScroll: true });
                }

                // Lanzar error tipado para el catch
                throw new ErrorValidacion('El formulario contiene campos inválidos.');
            }

            // — Recopilar datos del formulario
            const datos = new FormData(formulario);

            // — Envío
            UI.setEstadoBoton(btn, true);

            try {
                await this.simularFetch(datos);

                // Éxito: mostrar mensaje, limpiar storage y resetear formulario
                UI.mostrarMensajeEnvio(
                    mensajeEnvio,
                    'exito',
                    '¡Gracias! Hemos recibido tu solicitud en Sabor & Raíz. Te contactaremos pronto.'
                );
                Storage.limpiar();
                formulario.reset();
                Interfaz.actualizar();

            } catch (error) {
                if (error instanceof ErrorRed) {
                    UI.mostrarMensajeEnvio(
                        mensajeEnvio,
                        'error',
                        `No se pudo enviar tu solicitud (${error.status ?? 'sin conexión'}). Por favor, inténtalo de nuevo.`
                    );
                } else {
                    UI.mostrarMensajeEnvio(
                        mensajeEnvio,
                        'error',
                        'Ha ocurrido un error inesperado. Por favor, recarga la página e inténtalo de nuevo.'
                    );
                }
                console.error(`[${error.name}]`, error.message);

            } finally {
                UI.setEstadoBoton(btn, false);
            }
        },
    };


    //  EVENTOS

    const Eventos = {

        registrar(refs) {
            const { formulario, inputs } = refs;

            // — Submit
            formulario.addEventListener('submit', async (e) => {
                try {
                    await Envio.manejar(e, refs);
                } catch (error) {

                    if (!(error instanceof ErrorValidacion)) {
                        console.error('Error no controlado en el envío:', error);
                    }
                }
            });

            // — Cambio de tipo de consulta
            formulario.addEventListener('change', (e) => {
                if (e.target.name === 'tipo_consulta') {
                    Interfaz.actualizar();
                }
            });


            inputs.forEach(input => {
                // Validar al perder el foco
                input.addEventListener('blur', () => {
                    Validacion.validarCampo(input);
                });

                // Limpiar error al empezar a corregir un campo
                input.addEventListener('input', () => {
                    if (input.classList.contains('invalido')) {
                        Validacion.validarCampo(input);
                    }
                    Persistencia.guardarCampo({ target: input });
                });


                input.addEventListener('change', (e) => {
                    Persistencia.guardarCampo(e);

                    if (input.type === 'checkbox') {
                        Validacion.validarCampo(input);
                    }
                });
            });


            formulario.addEventListener('keydown', (e) => {
                const esRadioLabel = e.target.tagName === 'LABEL' &&
                    e.target.closest('.radio-group');

                if (esRadioLabel && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    // Activar el radio asociado a este label
                    const radioId = e.target.getAttribute('for');
                    const radio = document.getElementById(radioId);
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            });
        },
    };


    //INIT

    const Init = {

        seleccionarElementos() {
            const get = (id) => {
                const el = document.getElementById(id);
                if (!el) throw new Error(`Elemento #${id} no encontrado en el DOM.`);
                return el;
            };

            return {
                formulario:                  get('reserva-form'),
                btn:                         get('btn-enviar'),
                mensajeEnvio:                get('mensaje-envio'),
                radioEvento:                 get('evento'),
                radioEmpleo:                 get('empleo'),
                seccionGrupos:               get('seccion-grupos'),
                comensalesEvento:            get('comensales_evento'),
                contenedorArchivo:           get('contenedor-archivo'),
                contenedorComensalesNormal:  get('contenedor-comensales-normal'),
                comensalesNormal:            get('comensales_normal'),
                fieldsetReserva:             get('fieldset-reserva'),
            };
        },


        iniciar() {
            try {
                // 1. Seleccionar elementos del DOM
                const refs = this.seleccionarElementos();

                // Añadir inputs al objeto de refs (necesario para eventos y validación)
                refs.inputs = refs.formulario.querySelectorAll('input, select, textarea');

                // 2. Pasar referencias al módulo de Interfaz
                Interfaz.elementos = refs;

                // 3. Avisar si sessionStorage no está disponible
                if (!Soporte.sessionStorage) {
                    console.warn('sessionStorage no disponible. Los datos no se guardarán entre recargas.');
                }

                // 4. Avisar si fetch no está disponible
                if (!Soporte.fetch) {
                    console.warn('fetch no disponible. El envío del formulario puede no funcionar correctamente.');
                }

                // 5. Restaurar datos guardados de sesión anterior
                Persistencia.cargarTodo(refs.inputs);

                // 6. Sincronizar interfaz con el estado cargado
                Interfaz.actualizar();

                // 7. Registrar todos los eventos
                Eventos.registrar(refs);

            } catch (error) {
                // Error crítico de inicialización: elemento del DOM no encontrado
                console.error(`[Init] Error al arrancar la aplicación: ${error.message}`);
            }
        },
    };


    return {
        iniciar: () => Init.iniciar(),
    };

})();


// PUNTO DE ENTRADA

document.addEventListener('DOMContentLoaded', () => SaborRaiz.iniciar());