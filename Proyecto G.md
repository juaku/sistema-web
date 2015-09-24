# Variables básicas
# --------- -------
- objSelfUsr = Usuario
- objPostIde = Post
- objEventId = Evento
- objEventPo = Evento de 'objPostIde'
- objAutPost = Autor de 'objPostIde'
- arrayLikes = Likes de 'objPostIde'
- arrayPoEve = Posts del 'objEventId'
- arrayFollo = Seguidos por 'objSelfUsr'
- arrayFlagA = Denuncias a 'objSelfUsr'
- arrayFlagP = Denuncias a 'objPostIde'
- posGPSPost = Ubicación de 'objPostIde'
- posGPSSelf = ubicación de 'objSelfUsr' 

# ¿Qué posts mostrar primero?
# ---------------------------
- timeRecent (0 - ~) = ¿Qué tan cerca está 'objPostIde' de ahora?
- cntLocaGPS (0 - ~) = ¿Qué tan cerca está 'posGPSPost' de 'posGPSSelf'?
- cntLikesPo (0 - ~) = ¿Cuántos 'arrayLikes'?
- cntLikFoll (0 - ~) = ¿Cuántos de 'arrayFollo' están en 'arrayLikes'?
- cntFlagPst (0 - ~) = ¿Cantidad de 'arrayFlagP'?
- cntFlagAut (0 - ~) = ¿Cantidad de 'arrayFlagA'?
- boolAutFol (0 , 1) = ¿'objAutPost' está en 'arrayFollo'?
- boolSelfAu (0 , 1) = ¿'objSelfUsr' es 'objAutPost'?
- boolLocTru (0 , 1) = ¿La ubicación es exacta?
- boolBanned (0 , 1) = ¿'objAutPost' está baneado?

# ¿Qué evento mostrar primero?
# ----------------------------
- countPostE = ¿Cuantos 'arrayPoEve'?
- countFollE = ¿Cuántos 'arrayFollo' son autores en 'arrayPoEve'?
- countPoLoE = ¿Cuántos 'arrayPoEve' tiene un 'cntLocaGPS' (cercano)? (!)
- countRecPE = ¿Cuan recientes son los 'arrayPoEve'de 'objEventId'?
- boolSeltEv = ¿'objSelfUsr' está es 'objAutPost' de 'arrayPoEve'?

# Tiempo
# ------
- Cantidad de 'cntLikesPo' en T1
- Cantidad de 'cntLikFoll' en T2
- Cantidad de 'cntPostEve' en T3
- Cantidad de 'cntFollEve' en T4
- Cantidad de 'cntRecPstE' en T5
- Cantidad de 'cntPostEve' de 'objectPost' en T6
- Cantidad de 'objPostIde' de 'objSelfUsr' en 'arrayPoEve' en T7

# Fitness
# -------
- cntMtPLoad = ¿Cuantas cargas de página?
- cntMtPosts = ¿Cuantos post se realizaron?
- cntMtScrol = ¿Cuantos 'scrolls' se realizaron?
- cntMtLikes = ¿Cuantos likes se dieron?
- cntMtCliEv = ¿Cuantos clicks se dieron a eventos?
- cntMtSearc = ¿Cuántas búsquedas se realizaron?
- cntMtFollO = ¿Cuántas solicitudes de seguimiento se solicitaron? (!)
- cntMtFollI = ¿Cuántas solicitudes de seguimiento se recibieron? (!)
- cntMtLocaO = ¿Cuántas solicitudes de ubicación se solicitaron?
- cntMtLocaI = ¿Cuántas solicitudes de ubicación se recibieron?

Mt = 24 horas / Mtx de manera que {Mtx:Mt , 1:24 , 2:12 , 3:8 }

Mt NO se debe borrar ni reemplazar, sino se debe conservar para, por ejemplo, recuperar promedios de Mt * X donde se usa múltiplos de tiempo.

'cntSesLoad' en 'TimeD' (día) y en 'TimeM' (minutos)

# Algoritmo
# ---------

```
Inicio - Muestra de datos 
	Delta (0 - 1) = Obtener Delta()

	Por cada sessión:
		Si es primera generación
			Rnd = Random(Delta*2)
			Ix (0 - 1) = 0.5 + (Rnd - Delta)
			Fx (0 - 1) = 0.5 + (Rnd - Delta)
		Sino
			Escoger Ix,Fx de distintos n mejores inidividuos de la generación anterior

	Mostrar posts:
		Por cada 'objPostIde' evaluar prioridad:
			prioridad = (cntLikesPo*I1 + cntLikFoll*I2 + boolAutFol*I3 + boolSelfAu*I4 + boolLocTru*I5) / ((timeRecent*I6 + cntLocaGPS*I7 + cntFlagPst*I8 + cntFlagAut*I9 + boolBanned) + 1)
		Ordernar por prioridad alta()
		Mostrar post()

	Evaluar Fitness:
		Obtener variables Fitness()
		Fitnnes = cntSesLoad*F1 + cntSesPost*F2 + cntSesScro*F3 + cntSesLike*F4 + cntSesCliE*F5 + cntSesSrch*F6 + cntSesFolO*F7 + cntSesFolI*F8 + cntSesLocO*F9 + cntSesLocI*F10
		Si es primera generación
			Generar Promedio Fitness
			Guardar Ix,Fx
		Sino
		FitnessPromedio = Obtener promedio fitness desde tabla()
			Si Fitness > FitnessPromedio
				Guardar nuevos Ix, Fx, Fitness 
				Generar nuevo PromedioFitness()
			Sino
				Desechar individuo (¿Mejorar?)
Fin
```
# Datos
# -----
	1. FittnessGen
		- Ix
		- Fx
		- Fitness
		- Date
		- NumGen
	2. FitnessData
		- FitnessAverage
		- Delta

