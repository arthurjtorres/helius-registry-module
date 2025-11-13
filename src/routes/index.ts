import { Router } from "express";
import companyGroupRouter from "./CompanyGroupRouter";
import corporationRouter from "./CorporationRouter";
import companyRouter from './CompanyRouter';
import departmentRouter from "./DepartmentRouter";
import sectorRouter from "./SectorRouter";
import positionRouter from "./PositionRouter";
import vehicleTypeRouter from "./VehicleTypeRouter";
import locationRouter from "./LocationRouter";
import busTimetableRouter from "./BusTimetableRouter";
import personRouter from "./PersonRouter";
import documentRouter from "./DocumentRouter";
import employeeRouter from "./EmployeeRouter";
import vehicleRouter from "./VehicleRouter";



const router = Router();
router.use("/company-group",companyGroupRouter);
router.use("/corporation",corporationRouter);
router.use("/company", companyRouter);
router.use("/department", departmentRouter);
router.use("/sector", sectorRouter);
router.use("/position", positionRouter);
router.use("/vehicle-type", vehicleTypeRouter);
router.use("/vehicle", vehicleRouter);
router.use("/location",locationRouter);
router.use("/bus-timetable",busTimetableRouter);
router.use("/person", personRouter);
router.use("/document", documentRouter);
router.use("/employee", employeeRouter);

export default router;
